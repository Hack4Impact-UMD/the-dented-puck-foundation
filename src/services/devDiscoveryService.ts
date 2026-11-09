import AsyncStorage from '@react-native-async-storage/async-storage';
import { teams } from '../../sandbox/fixtures.mjs';
import { distanceKm, NEARBY_RADIUS_KM, validCoordinates } from '@/utils/homeLocation';
import type { HomeViewer, NearbyTeam } from '@/types/home';

// Device-local development preferences only. Never writes cloud membership data.
const storageKey = (uid: string) => `@dented-puck/dev-follows/${uid}`;

export async function loadDevFollows(uid: string, defaults: string[]): Promise<string[]> {
  if (!__DEV__) throw new Error('Development discovery is unavailable in release builds.');
  const saved = await AsyncStorage.getItem(storageKey(uid));
  if (saved === null) return [...defaults];
  const ids: unknown = JSON.parse(saved);
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) throw new Error('Invalid saved development follows.');
  const known = new Set(Object.values(teams).map((team) => team.id));
  return [...new Set(ids.filter((id) => known.has(id)))];
}

export async function setDevTeamFollowed(viewer: HomeViewer, teamId: string, followed: boolean): Promise<void> {
  if (!__DEV__) throw new Error('Development discovery is unavailable in release builds.');
  validateDevFollow(viewer, teamId);
  const ids = new Set(await loadDevFollows(viewer.uid, viewer.followedTeamIds));
  if (followed) ids.add(teamId);
  else ids.delete(teamId);
  await AsyncStorage.setItem(storageKey(viewer.uid), JSON.stringify([...ids].sort()));
}

export function validateDevFollow(viewer: HomeViewer, teamId: string): void {
  if (!Object.values(teams).some((team) => team.id === teamId) || viewer.teamIds.includes(teamId)) throw new Error('This team cannot be followed.');
}

export async function resetDevFollows(uid: string): Promise<void> {
  if (!__DEV__) throw new Error('Development discovery is unavailable in release builds.');
  await AsyncStorage.removeItem(storageKey(uid));
}

export async function nearbyDevTeams(viewer: HomeViewer, includeAffiliated = false): Promise<NearbyTeam[]> {
  if (!__DEV__) throw new Error('Development discovery is unavailable in release builds.');
  const origin = viewer.discoveryLocation;
  if (!validCoordinates(origin)) return [];
  const affiliated = new Set([...viewer.teamIds, ...viewer.followedTeamIds]);
  return Object.values(teams)
    // Keep followed teams in place so Follow becomes Unfollow. Only event
    // eligibility changes; following must not make the team card disappear.
    .filter((team) => includeAffiliated || !viewer.teamIds.includes(team.id))
    .map((team) => ({ ...team, distanceKm: distanceKm(origin, team.coordinates) }))
    .filter((team) => (includeAffiliated && affiliated.has(team.id)) || team.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
}
