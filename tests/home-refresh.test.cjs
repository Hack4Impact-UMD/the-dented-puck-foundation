const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { createLoader } = require('./helpers/load-sandbox.cjs');

const page = (title) => ({ items: title ? [{ id: title, title }] : [], hasMore: false });
const viewer = (uid) => ({ uid, name: uid, region: 'north', teamIds: [], followedTeamIds: [] });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

// Exercise the provider's async state and cleanup with controlled hook storage.
// This is not a native renderer or screen-reader test.
function mountProvider(source, { createPreviewSource } = {}) {
  const hooks = [];
  const listeners = new Set();
  const auth = { currentUser: { uid: 'first' } };
  const snapshots = [];
  let cursor = 0;
  let queued = false;
  let disposed = false;
  let effects = [];
  let context;
  let refreshingHooks = false;
  const equal = (a, b) => !refreshingHooks && a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const schedule = () => {
    if (queued || disposed) return;
    queued = true;
    queueMicrotask(() => { queued = false; if (!disposed) render(); });
  };
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = {
        value: typeof initial === 'function' ? initial() : initial,
        set(value) {
          const next = typeof value === 'function' ? value(hooks[index].value) : value;
          if (!Object.is(next, hooks[index].value)) { hooks[index].value = next; schedule(); }
        },
      };
      return [hooks[index].value, hooks[index].set];
    },
    useRef(value) {
      const index = cursor++;
      return hooks[index] ??= { current: value };
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) hooks[index] = { deps, callback };
      return hooks[index].callback;
    },
    useMemo(create, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) hooks[index] = { deps, value: create() };
      return hooks[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = hooks[index];
      if (equal(previous?.deps, deps)) return;
      hooks[index] = { deps, cleanup: previous?.cleanup };
      effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
    },
  };
  class HomeSetupError extends Error {}
  const load = createLoader({
    react,
    '@/firebase': { auth },
    'firebase/auth': {
      onAuthStateChanged(_, callback) {
        listeners.add(callback);
        queueMicrotask(() => { if (listeners.has(callback)) callback(auth.currentUser); });
        return () => listeners.delete(callback);
      },
    },
    '@/services/homeService': { createHomeDataSource: () => source, HomeSetupError },
    '@/config/sandbox': { isSandbox: false },
    '@/services/sandboxService': {},
    '@/services/homePreviewService': { HOME_PREVIEW_UID: 'preview', createHomePreviewSource: createPreviewSource },
  });
  const { HomeProvider } = load('src/hooks/useHomeDashboard.tsx');
  function render() {
    cursor = 0;
    effects = [];
    context = HomeProvider({ source, children: null }).props.value;
    snapshots.push(context.state);
    for (const effect of effects) effect();
  }
  render();
  return {
    get current() { return context; }, snapshots,
    signIn(uid) { auth.currentUser = uid ? { uid } : null; for (const listener of listeners) listener(auth.currentUser); },
    fastRefresh() {
      // React Native retains state but reruns memos/effects during Fast Refresh.
      refreshingHooks = true;
      try { render(); } finally { refreshingHooks = false; }
    },
    dispose() { disposed = true; for (const hook of hooks) hook?.cleanup?.(); },
  };
}

async function flush() { for (let index = 0; index < 20; index++) await Promise.resolve(); }
const makeSource = (overrides = {}) => ({
  loadViewer: async (uid) => viewer(uid), events: async () => page('original'), announcements: async () => page(),
  notificationCount: async () => 3, nearbyTeams: async () => [], ...overrides,
});

test('Follow refresh keeps the viewer, rows, and count visible until the updated feeds are ready', async () => {
  let following = false;
  const feeds = deferred();
  const mounted = mountProvider(makeSource({
    setTeamFollowed: async () => { following = true; },
    loadViewer: async (uid) => ({ ...viewer(uid), followedTeamIds: following ? ['new-team'] : [] }),
    events: async () => following ? feeds.promise : page('original'),
  }));
  await flush();
  const before = mounted.current.state;
  const start = mounted.snapshots.length;
  await mounted.current.followTeam('new-team', true);
  await flush();
  assert.equal(mounted.current.state.phase, 'ready');
  assert.equal(mounted.current.state.refreshing, true);
  assert.equal(mounted.current.state.pullRefreshing, false, 'Follow must not pull down the scroll view to show a refresh control');
  assert.equal(mounted.current.state.viewer, before.viewer);
  assert.equal(mounted.current.state.schedule.page, before.schedule.page);
  assert.equal(mounted.current.state.unreadCount, 3);
  feeds.resolve(page('updated'));
  await flush();
  assert.deepEqual(mounted.current.state.viewer.followedTeamIds, ['new-team']);
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'updated');
  assert.equal(mounted.current.state.refreshing, false);
  assert.ok(mounted.snapshots.slice(start).every((state) => state.phase === 'ready' && state.viewer));
  mounted.dispose();
});

test('only a pull gesture shows the refresh control; location updates retain content without pulling the page', async () => {
  let pendingRead = null;
  const mounted = mountProvider(makeSource({ events: async () => pendingRead ? pendingRead.promise : page('original') }));
  await flush();
  const original = mounted.current.state.schedule.page;
  pendingRead = deferred();
  mounted.current.pullRefresh();
  await flush();
  assert.equal(mounted.current.state.pullRefreshing, true);
  assert.equal(mounted.current.state.schedule.page, original);
  pendingRead.resolve(page('refreshed'));
  await flush();
  assert.equal(mounted.current.state.pullRefreshing, false);
  pendingRead = deferred();
  mounted.current.setDiscoveryLocation({ label: 'Baltimore', latitude: 39.29, longitude: -76.61, source: 'manual' });
  await flush();
  assert.equal(mounted.current.state.refreshing, true);
  assert.equal(mounted.current.state.pullRefreshing, false);
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'refreshed');
  pendingRead.resolve(page('near new location'));
  await flush();
  assert.equal(mounted.current.state.refreshing, false);
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'near new location');
  mounted.dispose();
});

test('account changes clear retained content immediately and discard a pending refresh', async () => {
  let refreshing = false;
  const oldFeeds = deferred();
  const nextViewer = deferred();
  const mounted = mountProvider(makeSource({
    loadViewer: async (uid) => uid === 'second' ? nextViewer.promise : viewer(uid),
    events: async (user) => refreshing && user.uid === 'first' ? oldFeeds.promise : page(user.uid),
  }));
  await flush();
  refreshing = true;
  mounted.current.refresh();
  await flush();
  mounted.signIn('second');
  await flush();
  assert.equal(mounted.current.state.viewer, null);
  assert.equal(mounted.current.state.schedule.page, null);
  oldFeeds.resolve(page('stale first account'));
  await flush();
  assert.equal(mounted.current.state.viewer, null);
  nextViewer.resolve(viewer('second'));
  await flush();
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'second');
  mounted.signIn(null);
  await flush();
  assert.equal(mounted.current.state.phase, 'signed-out');
  assert.equal(mounted.current.state.viewer, null);
  mounted.dispose();
});

test('a failed Follow write leaves the viewer, events, and nearby teams intact', async () => {
  let reads = 0;
  const mounted = mountProvider(makeSource({
    loadViewer: async (uid) => { ++reads; return viewer(uid); },
    nearbyTeams: async () => [{ id: 'new-team', name: 'Nearby team' }],
    setTeamFollowed: async () => { throw { code: 'permission-denied' }; },
  }));
  await flush();
  const before = mounted.current.state;
  await assert.rejects(mounted.current.followTeam('new-team', true), { code: 'permission-denied' });
  await flush();
  assert.equal(mounted.current.state, before);
  assert.equal(reads, 1, 'a failed write must not reload or clear any lists');
  mounted.dispose();
});

test('a failed refresh retains content, reports the error, and can be retried', async () => {
  let failed = false;
  const mounted = mountProvider(makeSource({ loadViewer: async (uid) => {
    if (failed) throw { code: 'unavailable' };
    return viewer(uid);
  } }));
  await flush();
  failed = true;
  mounted.current.pullRefresh();
  await flush();
  assert.equal(mounted.current.state.phase, 'ready');
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'original');
  assert.match(mounted.current.state.error, /internet connection/);
  assert.equal(mounted.current.state.refreshing, false);
  assert.equal(mounted.current.state.pullRefreshing, false, 'a failed pull refresh must stop the control');
  failed = false;
  mounted.current.refresh();
  await flush();
  assert.equal(mounted.current.state.error, null);
  assert.equal(mounted.current.state.refreshing, false);
  mounted.dispose();
});

test('For You and Discover retain the same screen type and the old Discover URL remains supported', () => {
  let params = {};
  const Dashboard = () => null;
  const load = createLoader({
    'expo-router': { useLocalSearchParams: () => params, Redirect: () => null },
    '@/components/home/HomeDashboardScreen': { HomeDashboardScreen: Dashboard },
  });
  const HomeScreen = load('src/app/tabs/home/index.tsx').default;
  const DiscoverLink = load('src/app/tabs/home/discover.tsx').default;
  const forYou = HomeScreen();
  params = { view: 'discover', focusTab: '1' };
  const discover = HomeScreen();
  assert.equal(discover.type, forYou.type);
  assert.equal(discover.key, forYou.key);
  assert.equal(forYou.props.tab, 'for-you');
  assert.equal(discover.props.tab, 'discover');
  assert.deepEqual(DiscoverLink().props.href, { pathname: '/tabs/home', params: { view: 'discover', focusTab: '1' } });
});

test('Fast Refresh replaces a stale fake-login source while retaining the preview session', async () => {
  global.__DEV__ = true;
  let factoryCalls = 0;
  let currentPreview = makeSource();
  const mounted = mountProvider(makeSource(), { createPreviewSource: () => { ++factoryCalls; return currentPreview; } });
  await flush();
  await mounted.current.enterPreview();
  await flush();
  assert.equal(mounted.current.state.nearby.items.length, 0);
  assert.equal(factoryCalls, 1);

  const baltimore = { label: 'Baltimore, MD', latitude: 39.2904, longitude: -76.6122, source: 'manual' };
  const teams = [{ id: 'rockets' }, { id: 'ice' }, { id: 'foxes' }];
  currentPreview = makeSource({ loadViewer: async (uid) => ({ ...viewer(uid), discoveryLocation: baltimore }), nearbyTeams: async () => teams });
  mounted.fastRefresh();
  await flush();
  assert.equal(factoryCalls, 2);
  assert.equal(mounted.current.isPreview, true);
  assert.equal(mounted.current.state.viewer.uid, 'preview');
  assert.equal(mounted.current.state.viewer.discoveryLocation.label, 'Baltimore, MD');
  assert.deepEqual(mounted.current.state.nearby.items, teams);

  mounted.current.refresh();
  await flush();
  mounted.current.setDiscoveryLocation({ ...baltimore, source: 'device' });
  await flush();
  assert.equal(factoryCalls, 2, 'ordinary refreshes and location changes must retain the active fixture source');
  mounted.dispose();
});

test('resetting preview follows refreshes both feeds and nearby teams while retaining the selected location', async () => {
  global.__DEV__ = true;
  let reset = false;
  const teams = [{ id: 'rockets' }, { id: 'ice' }, { id: 'foxes' }];
  const preview = makeSource({
    loadViewer: async (uid) => ({ ...viewer(uid), followedTeamIds: reset ? ['crew'] : ['crew', ...teams.map((team) => team.id)] }),
    nearbyTeams: async () => reset ? teams : [],
    events: async (_, section) => page(`${section}-${reset ? 'restored' : 'followed'}`),
    resetPreviewFollows: async (user) => { assert.equal(user.uid, 'preview'); reset = true; },
  });
  const mounted = mountProvider(makeSource(), { createPreviewSource: () => preview });
  await flush();
  await mounted.current.enterPreview();
  await flush();
  const baltimore = { label: 'Baltimore, MD', latitude: 39.2904, longitude: -76.6122, source: 'manual' };
  mounted.current.setDiscoveryLocation(baltimore);
  await flush();
  assert.equal(mounted.current.state.nearby.items.length, 0);
  await mounted.current.resetPreviewFollows();
  await flush();
  assert.equal(mounted.current.state.phase, 'ready');
  assert.equal(mounted.current.isPreview, true);
  assert.deepEqual(mounted.current.state.viewer.discoveryLocation, baltimore);
  assert.deepEqual(mounted.current.state.viewer.followedTeamIds, ['crew']);
  assert.deepEqual(mounted.current.state.nearby.items, teams);
  assert.equal(mounted.current.state.schedule.page.items[0].title, 'schedule-restored');
  assert.equal(mounted.current.state.upcoming.page.items[0].title, 'upcoming-restored');
  mounted.dispose();
});

test('resetting fake follows is blocked for real sessions and release builds', async () => {
  global.__DEV__ = true;
  let resetCalls = 0;
  const source = makeSource({ resetPreviewFollows: async () => { ++resetCalls; } });
  const mounted = mountProvider(source, { createPreviewSource: () => source });
  await flush();
  await assert.rejects(mounted.current.resetPreviewFollows(), /only available in the development preview/);
  await mounted.current.enterPreview();
  await flush();
  global.__DEV__ = false;
  await assert.rejects(mounted.current.resetPreviewFollows(), /only available in the development preview/);
  assert.equal(resetCalls, 0);
  global.__DEV__ = true;
  mounted.dispose();
});
