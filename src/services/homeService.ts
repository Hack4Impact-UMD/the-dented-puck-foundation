import {
  getDocs,
  limit,
  query,
  startAfter,
  Timestamp,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getUserProfile } from '@/services/authService';
import type {
  HomeAnnouncement, HomeBackendContract, HomeCursor, HomeDataSource,
  HomeEvent, HomePage, HomeSection,
  HomeEventTeam, HomeCoordinates,
} from '@/types/home';
import { eventBelongsInSection } from '@/utils/homeEvents';
import { validCoordinates } from '@/utils/homeLocation';

/** Generic injected-query adapter retained for sandbox/test callers. The live
 * default now uses firebaseHomeService's inspected, authorized cloud mapping.
 * Do not substitute guessed collection names or coerce numeric regions.
 */
export const homeBackendContract: HomeBackendContract | null = null;

export class HomeSetupError extends Error {
  constructor() {
    super('The dashboard data contract has not been configured.');
    this.name = 'HomeSetupError';
  }
}

export function homeDate(value: unknown): Date | null {
  const date = value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

/** Decoder for the local Event fields plus the task's explicit visibility flag.
 * A backend adapter can exclude unsupported event kinds before calling this.
 */
export function readHomeEvent(id: string, data: DocumentData, teams: HomeEventTeam[] = [], coordinates?: HomeCoordinates): HomeEvent | null {
  const startTime = homeDate(data.startTime);
  const endTime = homeDate(data.endTime);
  if (!id || typeof data.title !== 'string' || !data.title.trim() ||
      typeof data.location !== 'string' || !data.location.trim() ||
      typeof data.isTeamSpecific !== 'boolean' || !startTime || !endTime || endTime < startTime) {
    return null;
  }
  return { id, title: data.title.trim(), location: data.location.trim(), startTime, endTime, isTeamSpecific: data.isTeamSpecific, teams, ...(validCoordinates(coordinates) ? { coordinates } : {}) };
}

export function compareEvents(a: HomeEvent, b: HomeEvent) {
  return a.startTime.getTime() - b.startTime.getTime() || compareIds(a.id, b.id);
}

function compareIds(a: string, b: string) {
  // Match Firestore document-ID ordering, independent of device locale.
  const left = Array.from(a);
  const right = Array.from(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const difference = left[i].codePointAt(0)! - right[i].codePointAt(0)!;
    if (difference) return difference;
  }
  return left.length - right.length;
}

type Snapshot = QueryDocumentSnapshot<DocumentData>;
type ReadBatch = (source: Query<DocumentData>, after: Snapshot | null, size: number) => Promise<Snapshot[]>;

const readBatch: ReadBatch = async (source, after, size) => {
  const snapshot = await getDocs(query(source, ...(after ? [startAfter(after)] : []), limit(size)));
  return snapshot.docs;
};

/** Merge ordered membership streams without dropping unconsumed rows. Every
 * cursor advances only past consumed documents; the sixth valid item stays for
 * the next page. Duplicates across team queries are consumed together.
 * A read budget prevents malformed data from causing an unbounded mobile read.
 */
export async function readHomePage<T extends { id: string }>(
  sources: Query<DocumentData>[],
  decode: (id: string, data: DocumentData) => T | null,
  compare: (a: T, b: T) => number,
  size: number,
  cursor?: HomeCursor,
  fetchBatch: ReadBatch = readBatch,
): Promise<HomePage<T>> {
  if (!Number.isInteger(size) || size < 1 || size > 100) throw new Error('Invalid dashboard page size.');
  if (cursor && cursor.after.length !== sources.length) throw new Error('The dashboard cursor no longer matches its queries.');
  const after = sources.map((_, i) => cursor?.after[i] ?? null);
  const streams = sources.map(() => ({ rows: [] as Snapshot[], offset: 0, exhausted: false, read: 0 }));
  const batchSize = size + 1;
  const readBudget = Math.max(100, batchSize * 5);

  async function head(i: number): Promise<{ row: Snapshot; value: T } | null> {
    const stream = streams[i];
    while (true) {
      if (stream.offset === stream.rows.length) {
        if (stream.exhausted) return null;
        if (stream.read >= readBudget) throw new Error('Too many invalid dashboard records.');
        stream.rows = await fetchBatch(sources[i], after[i], batchSize);
        stream.offset = 0;
        stream.read += stream.rows.length;
        stream.exhausted = stream.rows.length < batchSize;
        if (!stream.rows.length) return null;
      }
      const row = stream.rows[stream.offset];
      const value = decode(row.id, row.data());
      if (value) return { row, value };
      after[i] = row;
      stream.offset++;
    }
  }

  const items: T[] = [];
  const heads = await Promise.all(sources.map((_, i) => head(i)));
  while (items.length < size) {
    let best: T | null = null;
    for (const candidate of heads) {
      if (candidate && (!best || compare(candidate.value, best) < 0)) best = candidate.value;
    }
    if (!best) break;
    items.push(best);
    const consumed = heads.flatMap((candidate, i) => candidate?.value.id === best.id ? [i] : []);
    await Promise.all(consumed.map(async (i) => {
      after[i] = heads[i]!.row;
      streams[i].offset++;
      heads[i] = await head(i);
    }));
  }
  const hasMore = heads.some(Boolean);
  return { items, cursor: { after }, hasMore };
}

export function createHomeDataSource(contract: HomeBackendContract | null = homeBackendContract): HomeDataSource {
  function approved(): HomeBackendContract {
    if (!contract) throw new HomeSetupError();
    return contract;
  }

  return {
    async loadViewer(uid) {
      const adapter = approved();
      const profile = await getUserProfile(uid);
      const viewer = await adapter.loadViewer(uid, profile);
      if (viewer.uid !== uid || !viewer.name.trim() ||
          !['string', 'number'].includes(typeof viewer.region) ||
          (typeof viewer.region === 'number' && !Number.isFinite(viewer.region)) ||
          (typeof viewer.region === 'string' && !viewer.region.trim()) ||
          !Array.isArray(viewer.teamIds) || !viewer.teamIds.every((id) => typeof id === 'string' && id.trim()) ||
          !Array.isArray(viewer.followedTeamIds) || !viewer.followedTeamIds.every((id) => typeof id === 'string' && id.trim())) {
        throw new Error('The dashboard profile has an invalid format.');
      }
      return { ...viewer, teamIds: [...new Set(viewer.teamIds)].sort(), followedTeamIds: [...new Set(viewer.followedTeamIds)].sort() };
    },
    async events(viewer, section: HomeSection, since, size, cursor) {
      const adapter = approved();
      if (section === 'schedule' && !viewer.teamIds.length && !viewer.followedTeamIds.length) return { items: [], cursor: { after: [] }, hasMore: false };
      return readHomePage(
        adapter.eventQueries(viewer, section, since),
        (id, data) => {
          const event = adapter.readEvent(id, data);
          return event && event.startTime >= since && eventBelongsInSection(event, viewer, section) ? event : null;
        },
        compareEvents, size, cursor,
      );
    },
    async announcements(viewer, size, cursor) {
      const adapter = approved();
      if (!viewer.teamIds.length) return { items: [], cursor: { after: [] }, hasMore: false };
      return readHomePage<HomeAnnouncement>(
        adapter.announcementQueries(viewer), adapter.readAnnouncement,
        (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || compareIds(a.id, b.id),
        size, cursor,
      );
    },
  };
}
