import type { Query, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/services/authService';
import type { Href } from 'expo-router';

export type HomeSection = 'schedule' | 'upcoming';

export interface HomeCoordinates {
  latitude: number;
  longitude: number;
}

export interface HomeLocation extends HomeCoordinates {
  label: string;
  source: 'device' | 'manual' | 'demo';
}

export interface NearbyTeam extends HomeEventTeam {
  city: string;
  ageRange: string;
  coordinates: HomeCoordinates;
  distanceKm: number;
}

/** Display data mapped by the approved adapter, not assumed Firestore fields. */
export interface HomeEventTeam {
  id: string;
  name: string;
  acronym?: string;
}

export interface HomeEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  isTeamSpecific: boolean;
  teams: HomeEventTeam[];
  coordinates?: HomeCoordinates;
}

export interface HomeAnnouncement {
  id: string;
  title: string;
  body: string;
  publishedAt: Date;
}

export interface HomeViewer {
  uid: string;
  name: string;
  teamIds: string[];
  followedTeamIds: string[];
  region: string | number;
  discoveryLocation?: HomeLocation;
}

export interface HomeCursor {
  // One cursor per membership query; never send snapshots through route params.
  after: (QueryDocumentSnapshot<DocumentData> | null)[];
  // Only the local development preview uses offsets; Firestore keeps snapshots.
  previewOffset?: number;
}

export interface HomePage<T> {
  items: T[];
  cursor: HomeCursor;
  hasMore: boolean;
}

export interface HomeSearchCatalog {
  schedule: HomeEvent[];
  upcoming: HomeEvent[];
  teams: NearbyTeam[];
}

/** Read adapters must be supplied from an approved backend contract, not inferred
 * from the incompatible profile/domain models. Queries must enforce visibility
 * and use ascending startTime + documentId ordering for every event stream.
 * Announcement streams must use descending publishedAt + documentId ordering.
 * Schedule queries include joined and followed teams; Discovery queries exclude
 * both. The adapter must resolve isTeamSpecific and regional visibility from
 * the approved backend semantics. Decoded events include their team display data.
 * Stream order must be deterministic for a viewer. Batch team filters within
 * Firestore disjunction limits and keep composite-index requirements documented
 * alongside the approved adapter. These are base queries without a page limit.
 */
export interface HomeBackendContract {
  loadViewer: (uid: string, profile: UserProfile) => Promise<HomeViewer>;
  eventQueries: (viewer: HomeViewer, section: HomeSection, since: Date) => Query<DocumentData>[];
  announcementQueries: (viewer: HomeViewer) => Query<DocumentData>[];
  readEvent: (id: string, data: DocumentData) => HomeEvent | null;
  readAnnouncement: (id: string, data: DocumentData) => HomeAnnouncement | null;
}

export interface HomeDataSource {
  loadViewer: (uid: string) => Promise<HomeViewer>;
  events: (viewer: HomeViewer, section: HomeSection, since: Date, size: number, cursor?: HomeCursor) => Promise<HomePage<HomeEvent>>;
  announcements: (viewer: HomeViewer, size: number, cursor?: HomeCursor) => Promise<HomePage<HomeAnnouncement>>;
  notificationCount?: (viewer: HomeViewer) => Promise<number>;
  /** Adapter supplies visible candidates; distance sorting is not authorization. */
  nearbyTeams?: (viewer: HomeViewer) => Promise<NearbyTeam[]>;
  setTeamFollowed?: (viewer: HomeViewer, teamId: string, followed: boolean) => Promise<void>;
  /** Development sources only: restore the fixture's default followed teams. */
  resetPreviewFollows?: (viewer: HomeViewer) => Promise<void>;
  /** Bounded, authorized candidate set. Live search reads the same scoped
   * event queries as Home and fails explicitly if a feed exceeds 100 items. */
  searchCatalog?: (viewer: HomeViewer, since: Date) => Promise<HomeSearchCatalog>;
}

/** Destinations owned by the sibling dashboard tasks. Omit unavailable routes
 * instead of navigating to an invented path or displaying an inert control.
 */
export interface HomeDestinations {
  eventList?: (section: HomeSection) => Href;
  nearbyTeamList?: Href;
  announcementList?: Href;
  team?: (teamId: string) => Href;
  event?: (eventId: string) => Href;
  announcement?: (announcementId: string) => Href;
  notifications?: Href;
  teams?: Href;
  chats?: Href;
  account?: Href;
  search?: Href;
}

export const HOME_PREVIEW_SIZE = 5;
export const DISCOVER_PREVIEW_SIZE = 2;
export const NEARBY_PREVIEW_SIZE = 2;
export const HOME_PAGE_SIZE = 20;
export const HOME_TITLES: Record<HomeSection, string> = {
  schedule: 'Schedule',
  upcoming: 'Upcoming Events',
};
