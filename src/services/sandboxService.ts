import { signInWithEmailAndPassword } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, doc, documentId, getDoc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { isSandbox, sandboxSettings } from '@/config/sandbox';
import { createHomeDataSource, readHomeEvent } from '@/services/homeService';
import type { HomeBackendContract, HomeDataSource, HomeEventTeam, HomeViewer } from '@/types/home';
import { createSandboxFixtures, demoLocations } from '../../sandbox/fixtures.mjs';
import { nearbyDevTeams, validateDevFollow } from '@/services/devDiscoveryService';
import { loadDevSearchCatalog } from '@/services/devHomeSearchService';

function requireSandbox() {
  if (!isSandbox || db.app.options.projectId !== sandboxSettings.projectId || !auth.emulatorConfig) {
    throw new Error('Start the local sandbox with npm run sandbox first.');
  }
}

export async function signInToSandbox() {
  requireSandbox();
  return signInWithEmailAndPassword(auth, sandboxSettings.email, sandboxSettings.password);
}

function sandboxViewerRef(viewer: HomeViewer) {
  requireSandbox();
  if (auth.currentUser?.uid !== viewer.uid) throw new Error('Sign in before changing your followed teams.');
  return doc(db, 'SandboxViewers', viewer.uid);
}

/** Emulator-only read model. It makes no claims about the production schema.
 * The seed materializes each viewer's scoped feeds; app reads are UID scoped.
 */
export function createSandboxHomeSource(): HomeDataSource {
  requireSandbox();
  const contract: HomeBackendContract = {
    async loadViewer(uid, profile) {
      const snapshot = await getDoc(doc(db, 'SandboxViewers', uid));
      if (!snapshot.exists()) throw new Error('Run npm run sandbox:seed to create the preview data.');
      const data = snapshot.data();
      return { uid, name: profile.username, teamIds: data.teamIds, followedTeamIds: data.followedTeamIds, region: data.region,
        discoveryLocation: { ...demoLocations[0], source: 'demo' } };
    },
    eventQueries(viewer, section, since) {
      // Both already-authorized fixture streams are needed when a Follow
      // moves a team's events from Discovery into Schedule (or back).
      return ['schedule', 'upcoming'].map((feed) => query(
        collection(db, 'SandboxViewers', viewer.uid, feed),
        where('startTime', '>=', since), orderBy('startTime', 'asc'), orderBy(documentId(), 'asc'),
      ));
    },
    readEvent(id, data) {
      const teams: HomeEventTeam[] = Array.isArray(data.teams) ? data.teams : [];
      return readHomeEvent(id, data, teams, data.coordinates);
    },
    announcementQueries: () => [],
    readAnnouncement: () => null,
  };
  const source: HomeDataSource = {
    ...createHomeDataSource(contract),
    nearbyTeams: nearbyDevTeams,
    async setTeamFollowed(viewer, teamId, followed) {
      const ref = sandboxViewerRef(viewer);
      validateDevFollow(viewer, teamId);
      // Atomic membership update only. Never rewrite a viewer document, team,
      // or event; stale callbacks/devices must not replace other saved follows.
      await updateDoc(ref, { followedTeamIds: followed ? arrayUnion(teamId) : arrayRemove(teamId) });
    },
    async resetPreviewFollows(viewer) {
      await updateDoc(sandboxViewerRef(viewer), { followedTeamIds: createSandboxFixtures(sandboxSettings).viewer.followedTeamIds });
    },
    async notificationCount(viewer) {
      const snapshot = await getDoc(doc(db, 'SandboxViewers', viewer.uid));
      return snapshot.data()?.unreadCount;
    },
    searchCatalog: (viewer, since) => {
      requireSandbox();
      return loadDevSearchCatalog(source, viewer, since);
    },
  };
  return source;
}
