import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { HomeSetupError } from '@/services/homeService';
import { createFirebaseHomeSource } from '@/services/firebaseHomeService';
import { isSandbox } from '@/config/sandbox';
import { createSandboxHomeSource, signInToSandbox } from '@/services/sandboxService';
import { createHomePreviewSource, HOME_PREVIEW_UID } from '@/services/homePreviewService';
import {
  DISCOVER_PREVIEW_SIZE, HOME_PREVIEW_SIZE, type HomeAnnouncement, type HomeDataSource, type HomeDestinations, type HomeEvent,
  type HomeLocation, type NearbyTeam, type HomePage, type HomeViewer,
} from '@/types/home';
import { validCoordinates } from '@/utils/homeLocation';

export interface HomeResult<T> {
  loading: boolean;
  page: HomePage<T> | null;
  error: string | null;
}

interface DashboardState {
  phase: 'loading' | 'signed-out' | 'ready' | 'error';
  refreshing: boolean;
  pullRefreshing: boolean;
  viewer: HomeViewer | null;
  since: Date;
  error: string | null;
  schedule: HomeResult<HomeEvent>;
  upcoming: HomeResult<HomeEvent>;
  announcements: HomeResult<HomeAnnouncement>;
  unreadCount: number | null;
  nearby: { loading: boolean; items: NearbyTeam[]; error: string | null };
}

const pending = <T,>(): HomeResult<T> => ({ loading: true, page: null, error: null });
const initialState = (): DashboardState => ({
  phase: 'loading', refreshing: false, pullRefreshing: false, viewer: null, since: new Date(), error: null,
  schedule: pending(), upcoming: pending(), announcements: pending(), unreadCount: null,
  nearby: { loading: true, items: [], error: null },
});

const defaultSource = isSandbox ? createSandboxHomeSource() : createFirebaseHomeSource();
const HomeContext = createContext<{
  state: DashboardState;
  source: HomeDataSource;
  destinations: HomeDestinations;
  refresh: () => void;
  pullRefresh: () => void;
  isPreview: boolean;
  enterPreview: () => Promise<void>;
  exitPreview: () => Promise<void>;
  isCurrentViewer: (uid: string) => boolean;
  setDiscoveryLocation: (location: HomeLocation) => void;
  followTeam: (teamId: string, followed: boolean) => Promise<void>;
  resetPreviewFollows: () => Promise<void>;
} | null>(null);

export function homeErrorMessage(error: unknown): string {
  if (error instanceof HomeSetupError) return 'Your dashboard is not available yet. Please try again later.';
  if (error instanceof Error && error.message.startsWith('User profile not found')) {
    return 'We could not find your profile. Please contact your team administrator.';
  }
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  if (code === 'permission-denied') return 'You do not have access to this information. Please contact your team administrator.';
  if (code === 'unavailable') return 'Check your internet connection and try again.';
  return 'We could not load this information. Please try again.';
}

const noDestinations: HomeDestinations = {};

export function HomeProvider({ children, source: suppliedSource = defaultSource, destinations = noDestinations }: {
  children: ReactNode; source?: HomeDataSource; destinations?: HomeDestinations;
}) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [revision, setRevision] = useState(0);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  // Keep session identity in state, not a snapshot of fixture data/functions.
  // Fast Refresh reruns this memo when the preview implementation changes.
  const previewSource = useMemo(() => previewEnabled ? createHomePreviewSource() : null, [previewEnabled]);
  const [location, setLocation] = useState<{ uid: string; value: HomeLocation } | null>(null);
  const followBusy = useRef(false);
  const loadedAccount = useRef<{ uid: string; source: HomeDataSource } | null>(null);
  const pullRequested = useRef(false);
  const source = previewSource ?? suppliedSource;
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const pullRefresh = useCallback(() => {
    pullRequested.current = true;
    refresh();
  }, [refresh]);
  const enterPreview = useCallback(async () => {
    if (!__DEV__) throw new Error('Fake login is only available in development.');
    setLocation(null);
    if (isSandbox) await signInToSandbox();
    else setPreviewEnabled(true);
  }, []);
  const exitPreview = useCallback(async () => {
    setLocation(null);
    if (previewSource) setPreviewEnabled(false);
    else if (isSandbox) await signOut(auth);
  }, [previewSource]);
  const isCurrentViewer = useCallback((uid: string) => previewSource
    ? uid === HOME_PREVIEW_UID : auth.currentUser?.uid === uid, [previewSource]);
  const setDiscoveryLocation = useCallback((value: HomeLocation) => {
    if (!state.viewer || !validCoordinates(value)) return;
    setLocation({ uid: state.viewer.uid, value });
  }, [state.viewer]);
  const followTeam = useCallback(async (teamId: string, followed: boolean) => {
    if (!state.viewer || !source.setTeamFollowed) throw new Error('Following teams is unavailable.');
    if (followBusy.current) throw new Error('Please wait for the current follow to finish.');
    followBusy.current = true;
    try {
      await source.setTeamFollowed(state.viewer, teamId, followed);
      refresh();
    } finally { followBusy.current = false; }
  }, [state.viewer, source, refresh]);
  const resetPreviewFollows = useCallback(async () => {
    if (!__DEV__ || !(isSandbox || previewEnabled) || !state.viewer || !source.resetPreviewFollows) {
      throw new Error('Resetting fake follows is only available in the development preview.');
    }
    if (followBusy.current) throw new Error('Please wait for the current follow to finish.');
    followBusy.current = true;
    try {
      await source.resetPreviewFollows(state.viewer);
      refresh();
    } finally { followBusy.current = false; }
  }, [previewEnabled, state.viewer, source, refresh]);

  useEffect(() => {
    let active = true;
    let request = 0;
    const loadAccount = (uid: string | null) => {
      if (!active) return;
      const currentRequest = ++request;
      const fresh = initialState();
      const pullRefreshing = pullRequested.current;
      pullRequested.current = false;
      // A refresh of the same session keeps the mounted content until its
      // replacement is ready. Account/source changes still clear it immediately.
      const keepContent = !!uid && loadedAccount.current?.uid === uid && loadedAccount.current.source === source;
      if (keepContent) setState((previous) => ({ ...previous, refreshing: true, pullRefreshing: previous.pullRefreshing || pullRefreshing, error: null }));
      else {
        loadedAccount.current = null;
        setState(uid ? fresh : { ...fresh, phase: 'signed-out' });
      }
      if (!uid) return;
      const isCurrent = () => active && request === currentRequest && (!!previewSource || auth.currentUser?.uid === uid);

      void (async () => {
        try {
          const loadedViewer = await source.loadViewer(uid);
          const viewer = location?.uid === uid ? { ...loadedViewer, discoveryLocation: location.value } : loadedViewer;
          if (!isCurrent()) return;
          loadedAccount.current = { uid, source };
          if (!keepContent) setState({ ...fresh, phase: 'ready', viewer });

          async function load<T>(key: 'schedule' | 'upcoming' | 'announcements', readPage: () => Promise<HomePage<T>>): Promise<HomeResult<T>> {
            let result: HomeResult<T>;
            try {
              result = { page: await readPage(), loading: false, error: null };
            } catch (error) {
              result = { page: null, loading: false, error: homeErrorMessage(error) };
            }
            if (!keepContent && isCurrent()) setState((previous) => ({ ...previous, [key]: result }));
            return result;
          }
          async function loadNotificationCount(): Promise<number | null> {
            if (!source.notificationCount) return null;
            try {
              const count = await source.notificationCount(viewer);
              if (Number.isSafeInteger(count) && count >= 0) {
                if (!keepContent && isCurrent()) setState((previous) => ({ ...previous, unreadCount: count }));
                return count;
              }
            } catch { /* A failed count must not hide the event feeds or imply zero unread. */ }
            return null;
          }
          async function loadNearby(): Promise<DashboardState['nearby']> {
            let nearby: DashboardState['nearby'];
            try {
              nearby = source.nearbyTeams
                ? { loading: false, items: await source.nearbyTeams(viewer), error: null }
                : { loading: false, items: [], error: 'Nearby teams are not available yet.' };
            } catch (error) {
              nearby = { loading: false, items: [], error: homeErrorMessage(error) };
            }
            if (!keepContent && isCurrent()) setState((previous) => ({ ...previous, nearby }));
            return nearby;
          }
          const [schedule, upcoming, announcements, unreadCount, nearby] = await Promise.all([
            load('schedule', () => source.events(viewer, 'schedule', fresh.since, HOME_PREVIEW_SIZE)),
            load('upcoming', () => source.events(viewer, 'upcoming', fresh.since, DISCOVER_PREVIEW_SIZE)),
            load('announcements', () => source.announcements(viewer, HOME_PREVIEW_SIZE)),
            loadNotificationCount(), loadNearby(),
          ]);
          if (keepContent && isCurrent()) setState({ ...fresh, phase: 'ready', viewer, schedule, upcoming, announcements, unreadCount, nearby });
        } catch (error) {
          if (isCurrent()) {
            if (keepContent) setState((previous) => ({ ...previous, refreshing: false, pullRefreshing: false, error: homeErrorMessage(error) }));
            else setState({ ...fresh, phase: 'error', error: homeErrorMessage(error) });
          }
        }
      })();
    };
    const authError = () => {
      ++request;
      loadedAccount.current = null;
      if (active) setState({ ...initialState(), phase: 'error', error: 'We could not check your sign-in. Please try again.' });
    };
    // A local preview is an independent UI session. Existing Firebase sessions
    // and their in-flight reads must never replace the selected fake account.
    const unsubscribe = previewSource
      ? (loadAccount(HOME_PREVIEW_UID), () => {})
      : onAuthStateChanged(auth, (user) => loadAccount(user?.uid ?? null), authError);
    return () => { active = false; ++request; unsubscribe(); };
  }, [revision, source, previewSource, location]);

  return <HomeContext.Provider value={{ state, source, destinations, refresh, pullRefresh, isPreview: isSandbox || !!previewSource, enterPreview, exitPreview, isCurrentViewer, setDiscoveryLocation, followTeam, resetPreviewFollows }}>{children}</HomeContext.Provider>;
}

export function useHomeDashboard() {
  const context = useContext(HomeContext);
  if (!context) throw new Error('useHomeDashboard must be used inside HomeProvider.');
  return context;
}
