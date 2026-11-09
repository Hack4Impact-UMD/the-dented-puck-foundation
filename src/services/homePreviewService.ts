import { createSandboxFixtures } from '../../sandbox/fixtures.mjs';
import settings from '@/config/sandboxSettings.json';
import { readHomeEvent } from '@/services/homeService';
import { eventBelongsInSection } from '@/utils/homeEvents';
import type { HomeDataSource, HomeEvent, HomeViewer } from '@/types/home';
import { loadDevFollows, nearbyDevTeams, resetDevFollows, setDevTeamFollowed } from '@/services/devDiscoveryService';
import { loadDevSearchCatalog } from '@/services/devHomeSearchService';

export const HOME_PREVIEW_UID = 'local-home-preview';

/** Uses the same fake events as the Firestore seed, without touching Firebase.
 * This lets the regular Expo Go development server preview Home in one tap.
 */
export function createHomePreviewSource(): HomeDataSource {
  if (!__DEV__) throw new Error('Fake login is only available in development.');
  const fixtures = createSandboxFixtures(settings);
  const viewer: HomeViewer = { ...fixtures.viewer, uid: HOME_PREVIEW_UID,
    discoveryLocation: { ...fixtures.viewer.discoveryLocation, source: 'demo' } };
  const source: HomeDataSource = {
    async loadViewer(uid) {
      if (uid !== HOME_PREVIEW_UID) throw new Error('Invalid preview account.');
      return { ...viewer, followedTeamIds: await loadDevFollows(uid, viewer.followedTeamIds) };
    },
    async events(user, section, since, size, cursor) {
      if (!Number.isInteger(size) || size < 1 || size > 100) throw new Error('Invalid preview page size.');
      const offset = cursor?.previewOffset ?? 0;
      const items = [...fixtures.schedule, ...fixtures.upcoming]
        .map(({ id, ...data }) => readHomeEvent(id, data, data.teams, data.coordinates))
        .filter((event): event is HomeEvent => !!event && event.startTime >= since && eventBelongsInSection(event, user, section))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      return { items: items.slice(offset, offset + size), cursor: { after: [], previewOffset: offset + size }, hasMore: offset + size < items.length };
    },
    async announcements() { return { items: [], cursor: { after: [] }, hasMore: false }; },
    async notificationCount() { return fixtures.viewer.unreadCount; },
    nearbyTeams: nearbyDevTeams,
    setTeamFollowed: setDevTeamFollowed,
    async resetPreviewFollows(user) {
      if (user.uid !== HOME_PREVIEW_UID) throw new Error('Invalid preview account.');
      await resetDevFollows(user.uid);
    },
    searchCatalog: (user, since) => loadDevSearchCatalog(source, user, since),
  };
  return source;
}
