const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createLoader } = require('./helpers/load-sandbox.cjs');

test('team results expose Joined, Follow and Unfollow with the correct Follow action', async () => {
  for (const relationship of ['joined', 'followed', 'neither']) {
    const controls = [];
    const actions = [];
    const team = { id: 'blades', name: 'Baltimore Blades', city: 'Baltimore, MD', ageRange: 'All ages', distanceKm: 2 };
    const host = (type) => ({ children, ...props }) => { controls.push({ type, ...props }); return React.createElement('div', null, children); };
    const load = createLoader({
      'expo-router': { useFocusEffect() {} },
      'react-native': { ...Object.fromEntries(['ActivityIndicator', 'Pressable', 'Text', 'View'].map((name) => [name, host(name)])), Platform: { OS: 'ios' } },
      '@/components/team/TeamIcon': () => null,
      '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({
        state: { viewer: { teamIds: relationship === 'joined' ? [team.id] : [], followedTeamIds: relationship === 'followed' ? [team.id] : [] } },
        source: { setTeamFollowed() {} }, followTeam: async (...args) => actions.push(args),
        destinations: {},
      }) },
    });
    const { NearbyTeamCard } = load('src/components/home/NearbyTeamCard.tsx');
    const html = renderToStaticMarkup(React.createElement(NearbyTeamCard, { team }));
    if (relationship === 'joined') {
      assert.match(html, /Joined/);
      assert.ok(controls.some((item) => item.accessibilityLabel?.endsWith(', Joined')));
      assert.equal(controls.some((item) => item.accessibilityLabel === 'Follow Baltimore Blades'), false);
    } else {
      const action = controls.find((item) => item.accessibilityLabel === `${relationship === 'followed' ? 'Unfollow' : 'Follow'} Baltimore Blades`);
      assert.equal(action.accessibilityLabel, `${relationship === 'followed' ? 'Unfollow' : 'Follow'} Baltimore Blades`);
      await action.onPress();
      assert.deepEqual(actions, [[team.id, relationship !== 'followed']]);
      if (relationship === 'followed') assert.ok(controls.some((item) => item.accessibilityLabel?.endsWith(', Followed')));
    }
  }
});

// Controlled hook storage exercises promise cancellation without a native
// renderer, emulator, simulator, or additional testing dependency.
function mountSearch(dashboard, options = { enabled: true }) {
  const hooks = [];
  let cursor = 0;
  let effects = [];
  let disposed = false;
  let current;
  const equal = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { value: initial, set(next) { hooks[index].value = typeof next === 'function' ? next(hooks[index].value) : next; if (!disposed) render(); } };
      return [hooks[index].value, hooks[index].set];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) hooks[index] = { deps, callback };
      return hooks[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = hooks[index];
      if (equal(previous?.deps, deps)) return;
      hooks[index] = { deps, cleanup: previous?.cleanup };
      effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
    },
  };
  const load = createLoader({ react, '@/hooks/useHomeDashboard': { useHomeDashboard: () => dashboard, homeErrorMessage: () => 'Please try again.' } });
  const { useHomeSearch } = load('src/hooks/useHomeSearch.ts');
  function render() {
    cursor = 0;
    effects = [];
    current = useHomeSearch(options.enabled);
    for (const effect of effects) effect();
  }
  render();
  return { get current() { return current; }, render, dispose() { disposed = true; for (const hook of hooks) hook?.cleanup?.(); } };
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { for (let index = 0; index < 10; index++) await Promise.resolve(); };

test('a synchronous catalog failure is shown as a retryable error instead of crashing when search opens', async () => {
  const catalog = { schedule: [], upcoming: [], teams: [] };
  let failed = true;
  let reads = 0;
  const options = { enabled: false };
  const dashboard = {
    state: { phase: 'ready', viewer: { uid: 'preview' }, since: new Date() },
    source: { searchCatalog() { ++reads; if (failed) throw new Error('Search source unavailable'); return Promise.resolve(catalog); } },
    isCurrentViewer: () => true,
  };
  const mounted = mountSearch(dashboard, options);
  await flush();
  assert.equal(reads, 0, 'the closed Home search does not fetch the full catalog');
  assert.equal(mounted.current.loading, false);
  options.enabled = true;
  mounted.render();
  await flush();
  assert.equal(mounted.current.loading, false);
  assert.equal(mounted.current.error, 'Please try again.');
  failed = false;
  mounted.current.reload();
  await flush();
  assert.equal(mounted.current.error, null);
  assert.equal(mounted.current.catalog, catalog);
  mounted.dispose();
});

test('search drops stale account/location reads, supports retry and ignores responses after unmount', async () => {
  const reads = [];
  const dashboard = {
    state: { phase: 'ready', viewer: { uid: 'first' }, since: new Date() },
    source: { searchCatalog() { const read = deferred(); reads.push(read); return read.promise; } },
    isCurrentViewer: (uid) => uid === dashboard.state.viewer?.uid,
  };
  const mounted = mountSearch(dashboard);
  const old = { schedule: [{ id: 'old' }], upcoming: [], teams: [] };
  const fresh = { schedule: [], upcoming: [{ id: 'fresh' }], teams: [] };
  dashboard.state.viewer = { uid: 'second' };
  mounted.render();
  reads[0].resolve(old);
  await flush();
  assert.equal(mounted.current.catalog, null);
  reads[1].resolve(fresh);
  await flush();
  assert.equal(mounted.current.catalog, fresh);
  dashboard.state.viewer = { ...dashboard.state.viewer, discoveryLocation: { label: 'New city' } };
  mounted.render();
  assert.equal(mounted.current.catalog, null);
  reads[2].reject(new Error('offline'));
  await flush();
  assert.equal(mounted.current.error, 'Please try again.');
  mounted.current.reload();
  assert.equal(mounted.current.loading, true);
  assert.equal(mounted.current.error, null);
  reads[3].resolve(fresh);
  await flush();
  assert.equal(mounted.current.catalog, fresh);
  mounted.current.reload();
  mounted.dispose();
  reads[4].resolve(old);
  await flush();
  assert.equal(mounted.current.catalog, null);
});

test('the original Home search field opens results in place and preserves filters, typing, keyboard controls and account isolation', (t) => {
  global.requestAnimationFrame ??= () => {};
  global.cancelAnimationFrame ??= () => {};
  t.mock.method(global, 'requestAnimationFrame', () => 1);
  t.mock.method(global, 'cancelAnimationFrame', () => {});
  for (const platform of ['ios', 'android']) {
    const controls = [];
    const navigations = [];
    const focusEffects = [];
    let cleanups = [];
    let session;
    let focused = 0;
    let dismissed = 0;
    let hardwareBack;
    const coordinates = { latitude: 39.29, longitude: -76.61 };
    const catalog = { teams: [],
      schedule: [{ id: 'mine', title: 'My team practice', location: 'Community Rink', teams: [], startTime: new Date('2026-11-11'), coordinates }],
      upcoming: [{ id: 'late', title: 'Season kickoff skate', location: 'Frederick Ice Center', teams: [], startTime: new Date('2026-11-12'), coordinates }],
    };
    const dashboard = { state: { phase: 'ready', viewer: { uid: 'fake', name: 'Abir', discoveryLocation: { label: 'Baltimore', ...coordinates } }, unreadCount: null, announcements: { page: { items: [] } } }, destinations: {} };
    let search = { catalog, available: true, loading: false };
    const host = (type, tag = 'div') => ({ children, ...props }) => {
      controls.push({ type, ...props });
      if (type === 'TextInput') { if (props.ref) props.ref.current = { focus() { ++focused; } }; return React.createElement('input', { value: props.value, readOnly: true }); }
      return React.createElement(tag, null, children);
    };
    const native = Object.fromEntries(['ActivityIndicator', 'View', 'Text', 'Pressable', 'Image', 'TextInput', 'ScrollView', 'RefreshControl'].map((name) => [name, host(name)]));
    native.Animated = { View: host('Animated.View') };
    native.Platform = { OS: platform };
    native.Keyboard = { dismiss() { ++dismissed; } };
    native.AccessibilityInfo = { announceForAccessibility() {}, announceForAccessibilityWithOptions() {} };
    native.BackHandler = { addEventListener(event, callback) { assert.equal(event, 'hardwareBackPress'); hardwareBack = callback; return { remove() {} }; } };
    native.FlatList = (props) => {
      controls.push({ type: 'FlatList', ...props });
      return React.createElement('div', null, props.ListHeaderComponent,
        props.data.length ? props.data.map((item) => React.createElement(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item }))) : props.ListEmptyComponent);
    };
    const load = createLoader({
      react: { ...React, useState: (initial) => [session ?? initial, (next) => { session = typeof next === 'function' ? next(session ?? initial) : next; }] },
      'react-native': native,
      'react-native-reanimated': require('./helpers/reanimated-host.cjs').reanimatedHost(host),
      'react-native-safe-area-context': { SafeAreaView: host('SafeAreaView') },
      'expo-router': { Link: host('Link'), Redirect: host('Redirect'), useFocusEffect(callback) { focusEffects.push(callback); }, router: { push: (route) => navigations.push(route) } },
      '@/assets/home/search.png': { uri: 'search' }, '@/assets/home/notification-bell.png': { uri: 'bell' },
      '@/hooks/useHomeDashboard': { useHomeDashboard: () => dashboard },
      '@/hooks/useHomeSearch': { useHomeSearch: () => search },
      '@/hooks/useHomeTitleFocus': { useHomeTitleFocus: () => ({ title: { current: null }, onTitleLayout() {} }) },
      '@/hooks/useHomeTabTransition': { useHomeTabTransition: (tab) => ({ selectedTab: tab, displayedTab: tab }) },
      '@/components/home/HomeWordmark': { HomeWordmark: () => null },
      '@/components/home/HomeViewTabs': { HomeViewTabs: ({ tab }) => React.createElement('span', null, `Selected ${tab}`) },
      '@/components/home/HomeSection': { HomeSection: () => React.createElement('span', null, 'Dashboard schedule') },
      '@/components/home/NearbyTeamsSection': { NearbyTeamsSection: () => null },
      '@/components/home/DiscoveryLocationControl': { DiscoveryLocationControl: () => null },
      '@/components/home/AnnouncementCard': { AnnouncementCard: () => null },
      '@/components/home/EventCard': { EventCard: ({ event }) => React.createElement('span', null, event.title) },
      '@/components/home/NearbyTeamCard': { NearbyTeamCard: () => null },
    });
    const { HomeDashboardScreen } = load('src/components/home/HomeDashboardScreen.tsx');
    let tab = 'for-you';
    const render = (initialSearch = false) => {
      for (const cleanup of cleanups) cleanup();
      controls.length = 0;
      focusEffects.length = 0;
      const html = renderToStaticMarkup(React.createElement(HomeDashboardScreen, { tab, initialSearch }));
      cleanups = focusEffects.map((effect) => effect()).filter((cleanup) => typeof cleanup === 'function');
      assert.equal(controls.filter((item) => item.type === 'TextInput').length, 1, 'the original field is the only search input');
      assert.equal(controls.filter((item) => item.type === 'FlatList' || item.type === 'ScrollView').length, 1, 'Home and search share a single virtualized scroll container');
      return html;
    };
    const input = () => controls.find((item) => item.type === 'TextInput');
    const filter = (name) => controls.find((item) => item.accessibilityLabel === `Filter events: ${name}`);
    for (const value of ['for-you', 'discover']) {
      tab = value;
      session = undefined;
      assert.match(render(), /Dashboard schedule/);
      const initialField = input();
      assert.equal(initialField.accessibilityRole, 'search');
      assert.equal(initialField.autoFocus, undefined);
      initialField.onFocus();
      assert.match(render(), /Season kickoff skate/);
      assert.match(render(), /My team practice/);
      assert.equal(controls.find((item) => item.type === 'FlatList').refreshControl.props.enabled, false, 'search disables the existing refresh wrapper without removing it');
      assert.equal(input().autoFocus, undefined, 'search uses the focus the original field already received');
      assert.equal(navigations.length, 0, 'focusing the field never pushes a route');
      controls.find((item) => item.accessibilityLabel === 'Cancel search').onPress();
      assert.match(render(), new RegExp(`Selected ${value}`));
      assert.equal(controls.find((item) => item.type === 'FlatList').refreshControl.props.enabled, true);
    }
    input().onFocus();
    assert.match(render(), /Season kickoff skate/);
    assert.doesNotMatch(render(), /Nearby events plus your team schedule, at any distance/);
    assert.equal(input().accessibilityLabel, 'Search team, event, or city');
    assert.equal(input().editable, true);
    assert.equal(filter('All events').accessibilityState.selected, true);
    filter('My schedule').onPress();
    assert.doesNotMatch(render(), /Season kickoff skate/);
    assert.match(render(), /My team practice/);
    assert.equal(filter('My schedule').accessibilityState.selected, true);
    assert.doesNotMatch(render(), /Events from your joined and followed teams, at any distance/);
    filter('Nearby').onPress();
    assert.match(render(), /Season kickoff skate/);
    assert.equal(filter('Nearby').accessibilityState.selected, true);
    assert.doesNotMatch(render(), /Events in your area, including your teams/);
    filter('All events').onPress();
    render();
    input().onChangeText('kickoff');
    assert.match(render(), /Season kickoff skate/);
    const resultStatus = controls.find((item) => item.accessibilityLabel?.includes('1 event found for kickoff'));
    assert.ok(resultStatus);
    assert.match(resultStatus.accessibilityLabel, /^All events/);
    assert.doesNotMatch(render(), /My team practice/);
    input().onChangeText('no matches');
    assert.match(render(), /No matches found/);
    controls.find((item) => item.accessibilityLabel === 'Clear search').onPress();
    assert.match(render(), /Season kickoff skate/);
    assert.equal(focused, 1);
    const scroll = controls.find((item) => item.type === 'FlatList');
    assert.equal(scroll.keyboardShouldPersistTaps, 'handled');
    assert.equal(scroll.keyboardDismissMode, 'on-drag');
    assert.equal(scroll.automaticallyAdjustKeyboardInsets, true);
    assert.equal(typeof scroll.ListHeaderComponent, 'object');
    // Loading, failures and retries retain the same editable Home field.
    let retried = 0;
    search = { available: true, catalog: null, loading: true };
    assert.match(render(), /Loading events/);
    search = { available: true, catalog: null, loading: false, error: 'Offline', reload: () => { ++retried; } };
    assert.match(render(), /Unable to load search/);
    controls.find((item) => item.type === 'Pressable' && item.onPress === search.reload).onPress();
    assert.equal(retried, 1);
    search = { available: false, catalog: null, loading: false };
    assert.match(render(), /Search is not available yet/);
    assert.equal(hardwareBack(), true);
    assert.match(render(), /Dashboard schedule/);
    input().onFocus();
    render();
    controls.find((item) => item.type === 'SafeAreaView').onAccessibilityEscape();
    assert.match(render(), /Dashboard schedule/);
    assert.ok(dismissed >= 4);
    search = { catalog, available: true, loading: false };
    input().onChangeText('kickoff');
    render();
    dashboard.state.viewer = { ...dashboard.state.viewer, uid: 'other-account' };
    assert.match(render(), /Dashboard schedule/);
    assert.equal(input().value, '', 'account change clears query and exits search');
    assert.equal(controls.some((item) => item.accessibilityLabel === 'Cancel search'), false);
    dashboard.state.phase = 'signed-out';
    assert.match(render(), /Your community, in one place/);
    assert.equal(input().editable, false);
    assert.equal(navigations.length, 0, 'searching, filtering, cancelling and clearing never navigate');
    // Old search links enter the same Home interaction rather than a sheet.
    const SearchScreen = load('src/app/tabs/home/search.tsx').default;
    assert.deepEqual(SearchScreen().props.href, { pathname: '/tabs/home', params: { search: '1' } });
    dashboard.state.phase = 'ready';
    session = undefined;
    assert.match(render(true), /Season kickoff skate/);
    for (const cleanup of cleanups) cleanup();
  }
});
