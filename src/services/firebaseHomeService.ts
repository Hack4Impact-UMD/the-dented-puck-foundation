import { FirebaseError } from 'firebase/app';
import {
  arrayRemove, arrayUnion, collection, doc, documentId, getDoc, getDocs,
  limit, orderBy, query, updateDoc, where, type DocumentData,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { compareEvents, readHomeEvent, readHomePage } from '@/services/homeService';
import { eventBelongsInSection } from '@/utils/homeEvents';
import { distanceKm, isNearby, validCoordinates } from '@/utils/homeLocation';
import type { HomeCoordinates, HomeDataSource, HomeEvent, HomeEventTeam, HomeViewer, NearbyTeam } from '@/types/home';

interface LiveTeam extends HomeEventTeam {
  numericId: number;
  region: number;
  city: string;
  ageRange: string;
  coordinates?: HomeCoordinates;
}

const CATALOG_LIMIT = 200;
const MEMBERSHIP_LIMIT = 200;

function current(uid: string) {
  if (auth.currentUser?.uid !== uid) throw new FirebaseError('permission-denied', 'Sign in to access your dashboard.');
}

function numericId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readTeam(id: string, data: DocumentData): LiveTeam | null {
  // Both spellings exist in the inspected cloud project. Document IDs are the
  // app identity; numeric teamId remains the Events query value.
  const region = data.regionId ?? data.reigonId;
  if (!numericId(data.teamId) || !numericId(region) || !text(data.name)) return null;
  return { id, numericId: data.teamId, region, name: text(data.name),
    acronym: text(data.acronym) || undefined, city: text(data.city),
    ageRange: text(data.ageRange) || 'Age range unavailable',
    ...(validCoordinates(data.coordinates) ? { coordinates: data.coordinates } : {}),
  };
}

/** Live mapping inspected November 9 and authorized by the user. Existing
 * legacy records are decoded, never migrated. Only follows on the current
 * user's profile are client-written. See docs/firebase-final-checks.md.
 */
export function createFirebaseHomeSource(): HomeDataSource {
  let catalog: { uid: string; teams: LiveTeam[] } | null = null;

  function teamsFor(viewer: HomeViewer) {
    current(viewer.uid);
    if (catalog?.uid !== viewer.uid) throw new Error('Load your dashboard before reading its teams.');
    return catalog.teams;
  }

  function resolveTeam(value: unknown, teams: LiveTeam[]): LiveTeam | undefined {
    return teams.find((team) => numericId(value) ? team.numericId === value : typeof value === 'string' && team.id === value);
  }

  function decodeEvent(id: string, data: DocumentData, teams: LiveTeam[]): HomeEvent | null {
    if (!Array.isArray(data.teamIds) || !data.teamIds.length || !numericId(data.regionId)) return null;
    const mapped = data.teamIds.map((value: unknown) => resolveTeam(value, teams));
    const known = mapped.filter((team: LiveTeam | undefined): team is LiveTeam => !!team);
    if (known.length !== mapped.length) return null;
    return readHomeEvent(id, data, [...new Map(known.map((team: LiveTeam) => [team.id, team])).values()], data.coordinates);
  }

  function nearby(viewer: HomeViewer, includeJoined: boolean): NearbyTeam[] {
    const teams = teamsFor(viewer);
    if (!viewer.discoveryLocation) return [];
    return teams.filter((team) => team.region === viewer.region && (includeJoined || !viewer.teamIds.includes(team.id)) &&
      isNearby(viewer.discoveryLocation!, team.coordinates)).map((team) => ({
      ...team, coordinates: team.coordinates!, distanceKm: distanceKm(viewer.discoveryLocation!, team.coordinates!),
    })).sort((a, b) => a.distanceKm - b.distanceKm || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  const source: HomeDataSource = {
    async loadViewer(uid) {
      current(uid);
      const [profile, memberships, teamSnapshot] = await Promise.all([
        getDoc(doc(db, 'Users', uid)),
        getDocs(query(collection(db, 'UserToTeam'), where('userId', '==', uid), limit(MEMBERSHIP_LIMIT + 1))),
        // Teams are public under the deployed rules. A bounded active-team
        // catalog supplies names for multi-team events across region borders.
        getDocs(query(collection(db, 'Teams'), where('status', '==', 'active'), limit(CATALOG_LIMIT + 1))),
      ]);
      current(uid);
      if (!profile.exists()) throw new Error('User profile not found for the signed-in account.');
      const data = profile.data();
      const region = data.regionId ?? data.reigonId;
      const name = text(data.username) || [text(data.firstName), text(data.lastName)].filter(Boolean).join(' ');
      if (!numericId(region) || !name) throw new Error('Your profile needs a name and numeric regionId before Home can load.');
      if (memberships.size > MEMBERSHIP_LIMIT || teamSnapshot.size > CATALOG_LIMIT) {
        throw new Error('The dashboard team catalog exceeds its supported size.');
      }
      const teams = teamSnapshot.docs.flatMap((snapshot) => {
        const team = readTeam(snapshot.id, snapshot.data());
        return team ? [team] : [];
      });
      const joined = memberships.docs.filter((snapshot) => snapshot.data().status === 'active')
        .map((snapshot) => resolveTeam(snapshot.data().teamId, teams)?.id).filter((id): id is string => !!id);
      if (data.followedTeamIds !== undefined && (!Array.isArray(data.followedTeamIds) || data.followedTeamIds.some((id: unknown) => typeof id !== 'string'))) {
        throw new Error('Your saved followed teams have an invalid format.');
      }
      const followed = ((data.followedTeamIds ?? []) as string[]).filter((id) => teams.some((team) => team.id === id));
      catalog = { uid, teams };
      return { uid, name, region, teamIds: [...new Set(joined)].sort(), followedTeamIds: [...new Set(followed)].sort() };
    },
    async events(viewer, section, since, size, cursor) {
      const teams = teamsFor(viewer);
      const ids = teams.filter((team) => [...viewer.teamIds, ...viewer.followedTeamIds].includes(team.id)).map((team) => team.numericId);
      const sources = [];
      if (section === 'schedule') {
        for (let i = 0; i < ids.length; i += 30) sources.push(query(collection(db, 'Events'),
          where('teamIds', 'array-contains-any', ids.slice(i, i + 30)), where('startTime', '>=', since),
          orderBy('startTime', 'asc'), orderBy(documentId(), 'asc')));
      } else {
        sources.push(query(collection(db, 'Events'), where('regionId', '==', viewer.region),
          where('isTeamSpecific', '==', false), where('startTime', '>=', since),
          orderBy('startTime', 'asc'), orderBy(documentId(), 'asc')));
      }
      const page = await readHomePage(sources, (id, data) => {
        const event = decodeEvent(id, data, teams);
        return event && event.startTime >= since && eventBelongsInSection(event, viewer, section) ? event : null;
      }, compareEvents, size, cursor);
      current(viewer.uid);
      return page;
    },
    async announcements(viewer) {
      current(viewer.uid);
      // No announcement collection exists in the inspected schema. The count
      // method is intentionally absent, keeping unknown distinct from zero.
      return { items: [], hasMore: false, cursor: { after: [] } };
    },
    async nearbyTeams(viewer) { return nearby(viewer, false); },
    async setTeamFollowed(viewer, teamId, followed) {
      const teams = teamsFor(viewer);
      if (!teams.some((team) => team.id === teamId) || viewer.teamIds.includes(teamId)) throw new Error('This team cannot be followed.');
      // Atomic field transforms preserve other devices' follows and every
      // profile, membership, team, and event field outside this preference.
      await updateDoc(doc(db, 'Users', viewer.uid), { followedTeamIds: followed ? arrayUnion(teamId) : arrayRemove(teamId) });
      current(viewer.uid);
    },
    async searchCatalog(viewer, since) {
      const [schedule, upcoming] = await Promise.all([
        source.events(viewer, 'schedule', since, 100), source.events(viewer, 'upcoming', since, 100),
      ]);
      if (schedule.hasMore || upcoming.hasMore) throw new Error('There are too many events to search right now. Please try again later.');
      return { schedule: schedule.items, upcoming: upcoming.items, teams: nearby(viewer, true) };
    },
  };
  return source;
}
