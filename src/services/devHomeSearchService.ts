import { nearbyDevTeams } from '@/services/devDiscoveryService';
import type { HomeDataSource, HomeSearchCatalog, HomeViewer } from '@/types/home';

/** The fake catalog contains 34 visible events. Read both complete, already
 * scoped feeds, never the raw fixture/control records or a global collection.
 * Keep a hard read bound and fail explicitly if the sample outgrows it. */
export async function loadDevSearchCatalog(source: HomeDataSource, viewer: HomeViewer, since: Date): Promise<HomeSearchCatalog> {
  if (!__DEV__) throw new Error('Preview search is unavailable in release builds.');
  const [schedule, upcoming, teams] = await Promise.all([
    source.events(viewer, 'schedule', since, 100),
    source.events(viewer, 'upcoming', since, 100),
    nearbyDevTeams(viewer, true),
  ]);
  if (schedule.hasMore || upcoming.hasMore) throw new Error('The preview search catalog exceeds its read limit.');
  return { schedule: schedule.items, upcoming: upcoming.items, teams };
}
