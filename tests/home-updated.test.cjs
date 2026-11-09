// node --test tests/home-updated.test.cjs
// Uses installed React DOM for component rendering. Backend mappings here are
// test fixtures, not an assertion about the production Firestore schema.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Timestamp } = require('firebase/firestore');
const { reanimatedHost } = require('./helpers/reanimated-host.cjs');

const modules = new Map();
const controls = [];
const navigation = [];
const focusEffects = [];
const focusEvents = [];
const headerEffects = [];
const headerRefs = [];
const announcements = [];
const frames = new Map();
let nextFrame = 0;
let searchParams = {};
let platform = 'web';
let dimensions = { width: 412, height: 917, fontScale: 1, scale: 1 };
let dashboard;

function host(type, tag = 'div') {
  return function Host({ children, ...props }) {
    controls.push({ type, ...props });
    const attributes = { className: props.className, style: props.style,
      'data-label': props.accessibilityLabel, 'data-role': props.accessibilityRole,
      'data-selected': props.accessibilityState?.selected };
    if (type === 'Image') return React.createElement('img', { ...attributes, src: props.source.uri, alt: props.accessibilityLabel ?? '' });
    if (type === 'TextInput') return React.createElement('input', { ...attributes, placeholder: props.placeholder, readOnly: true });
    return React.createElement(tag, attributes, children);
  };
}
const native = Object.fromEntries(['ActivityIndicator', 'Image', 'Pressable', 'RefreshControl', 'ScrollView', 'Text', 'TextInput', 'View'].map((name) => [name, host(name)]));
native.FlatList = (props) => {
  controls.push({ type: 'FlatList', ...props });
  return React.createElement('div', null, props.ListHeaderComponent,
    props.data.length ? props.data.map((item) => React.createElement(React.Fragment, { key: props.keyExtractor(item) }, props.renderItem({ item }))) : props.ListEmptyComponent);
};
native.Platform = { get OS() { return platform; } };
native.AccessibilityInfo = {
  sendAccessibilityEvent(node, event) { focusEvents.push({ node, event }); },
  announceForAccessibilityWithOptions(message, options) { announcements.push({ message, options }); },
};
native.useWindowDimensions = () => dimensions;
native.Animated = {
  View: host('Animated.View'),
  Value: class {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    stopAnimation() {}
    interpolate({ outputRange }) { return outputRange[this.value === 1 ? 1 : 0]; }
    toString() { return String(this.value); }
  },
};
native.Easing = { out: (curve) => curve, cubic: (value) => value ** 3 };
global.requestAnimationFrame = (callback) => { const id = ++nextFrame; frames.set(id, callback); return id; };
global.cancelAnimationFrame = (id) => frames.delete(id);

function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback();
}

function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const loaded = new Module(filename, module);
  modules.set(filename, loaded);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const baseRequire = loaded.require.bind(loaded);
  loaded.require = (name) => {
    if (name === 'react' && filename.endsWith('/HomeHeader.tsx')) return {
      ...React,
      useRef(initial) { const ref = React.useRef(initial); headerRefs.push(ref); return ref; },
      useEffect(effect, dependencies) { headerEffects.push(effect); React.useEffect(effect, dependencies); },
    };
    if (name === 'react-native') return native;
    if (name === 'react-native-reanimated') return reanimatedHost(host);
    if (name === 'react-native-safe-area-context') return { SafeAreaView: host('SafeAreaView') };
    if (name === '@/hooks/useHomeDashboard') return { useHomeDashboard: () => dashboard };
    if (name === '@/hooks/useHomeSearch') return { useHomeSearch: () => ({ available: false, loading: false, catalog: null }) };
    if (name === 'expo-router') return {
      Link: host('Link', 'a'), Redirect: host('Redirect'), useFocusEffect(callback) {
        if (filename.endsWith('/HomeViewTabs.tsx') || filename.endsWith('/useHomeTabTransition.ts')) focusEffects.push(callback);
      }, useLocalSearchParams: () => searchParams,
      router: { push: (href) => navigation.push(href), replace: (href) => navigation.push(href), setParams: (params) => navigation.push({ params }) },
    };
    if (name === '@/services/authService') return { getUserProfile: async () => ({ username: 'Jason' }) };
    if (name === '@/services/discoveryLocationService') return { requestDiscoveryLocation: async () => { throw new Error('Not a device test.'); } };
    if (name === 'firebase/firestore') return {
      Timestamp, limit: (size) => ({ size }), startAfter: (after) => ({ after }),
      query: (source, ...constraints) => ({ ...source, ...Object.assign({}, ...constraints) }),
      getDocs: async (source) => {
        const start = source.after ? source.rows.findIndex((row) => row.id === source.after.id) + 1 : 0;
        return { docs: source.rows.slice(start, start + source.size) };
      },
    };
    if (name.startsWith('@/')) {
      const local = path.resolve(__dirname, '../src', name.slice(2));
      if (name.endsWith('.png')) {
        assert.ok(fs.statSync(local).size > 0, `Empty asset ${name}`);
        return { uri: `data:image/png;base64,${fs.readFileSync(local).toString('base64')}`, assetPath: local };
      }
      const resolved = ['.ts', '.tsx'].map((extension) => local + extension).find(fs.existsSync);
      assert.ok(resolved, `Cannot resolve ${name}`);
      return load(path.relative(path.resolve(__dirname, '..'), resolved));
    }
    return baseRequire(name);
  };
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

const { eventBelongsInSection, teamAcronym } = load('src/utils/homeEvents.ts');
const { createHomeDataSource, readHomeEvent, readHomePage, HomeSetupError } = load('src/services/homeService.ts');
const { HomeDashboardScreen } = load('src/components/home/HomeDashboardScreen.tsx');
const { EventCard } = load('src/components/home/EventCard.tsx');
const { SandboxControls } = load('src/components/dev/SandboxControls.tsx');
const epoch = new Date('2026-11-01T15:00:00Z');
const teams = {
  joined: { id: 'joined', name: 'Baltimore Blades' },
  followed: { id: 'followed', name: 'Dented Crew', acronym: 'DC' },
  outside: { id: 'outside', name: 'Away Squad' },
};
const viewer = { uid: 'jason', name: 'Jason', region: 'north', teamIds: ['joined'], followedTeamIds: ['followed'] };
const event = (n, team = teams.joined, extra = {}) => ({ id: `event-${String(n).padStart(3, '0')}`, title: `Practice ${n}`, startTime: new Date(+epoch + n * 3600000), endTime: new Date(+epoch + (n + 1) * 3600000), location: 'Rink, City', isTeamSpecific: true, teams: [team], region: 'north', ...extra });
const page = (items = [], hasMore = false) => ({ items, hasMore, cursor: { after: [] } });
const source = (items) => ({ rows: items.map((item) => ({ id: item.id, data: () => item })) });
const decode = (id, data) => readHomeEvent(id, data, data.teams);
const compare = (a, b) => a.startTime - b.startTime || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function render(tab, overrides = {}, destinations = {}) {
  controls.length = 0;
  focusEffects.length = 0;
  headerEffects.length = 0;
  headerRefs.length = 0;
  dashboard = { state: { phase: 'ready', viewer, unreadCount: null, schedule: { page: page(Array.from({ length: 6 }, (_, n) => event(n)), true) }, upcoming: { page: page(Array.from({ length: 6 }, (_, n) => event(n, teams.outside)), true) }, announcements: { page: page() }, ...overrides }, destinations, refresh() {} };
  const html = renderToStaticMarkup(React.createElement(HomeDashboardScreen, { tab }));
  // Static rendering has no screen lifecycle; activate the transition hook.
  focusEffects[0]();
  return html;
}

test('nearby previews keep Follow controls, delegate See All only to a supplied destination, and wrap at large text sizes', () => {
  const nearby = { loading: false, error: null, items: Array.from({ length: 3 }, (_, n) => ({ id: `nearby-${n}`, name: `Nearby Team ${n}`, city: 'Baltimore, MD', ageRange: 'All ages', distanceKm: 10 + n, coordinates: { latitude: 39.29, longitude: -76.61 } })) };
  for (const fontScale of [1, 2]) {
    dimensions = { ...dimensions, width: 390, fontScale };
    const html = render('discover', { nearby });
    assert.equal(controls.filter((control) => control.accessibilityLabel?.startsWith('Follow Nearby Team')).length, 2);
    assert.match(html, /Nearby Team 0/);
    assert.doesNotMatch(html, /Nearby Team 2/);
    const all = controls.find((control) => control.accessibilityLabel === 'See all nearby teams');
    assert.equal(all.disabled, true);
    assert.equal(all.accessibilityState.disabled, true);
    assert.equal(all.onPress, undefined);
    assert.match(html, /Unavailable/);
    assert.ok(controls.some((control) => control.style?.width === (fontScale > 1 ? '100%' : '45%')));
    render('discover', { nearby }, { nearbyTeamList: '/owner/nearby-teams' });
    const connected = controls.find((control) => control.accessibilityLabel === 'See all nearby teams');
    assert.equal(connected.disabled, false);
    connected.onPress();
    assert.equal(navigation.at(-1), '/owner/nearby-teams');
  }
  dimensions = { ...dimensions, width: 412, fontScale: 1 };
});

test('the development bar exposes an accessible fake-follow reset and blocks it while refreshing', async () => {
  global.__DEV__ = true;
  let resets = 0;
  dashboard = {
    state: { viewer, refreshing: false }, source: { resetPreviewFollows() {} },
    resetPreviewFollows: async () => { ++resets; },
  };
  controls.length = 0;
  assert.match(renderToStaticMarkup(React.createElement(SandboxControls)), /Reset fake follows/);
  const reset = controls.find((control) => control.accessibilityLabel === 'Reset fake follows to restore the default sample teams');
  assert.equal(reset.accessibilityRole, 'button');
  await reset.onPress();
  assert.equal(resets, 1);
  dashboard.state.refreshing = true;
  controls.length = 0;
  renderToStaticMarkup(React.createElement(SandboxControls));
  const pendingReset = controls.find((control) => control.accessibilityLabel === reset.accessibilityLabel);
  assert.equal(pendingReset.disabled, true);
  assert.equal(pendingReset.accessibilityState.disabled, true);
  await pendingReset.onPress();
  assert.equal(resets, 1);
  global.__DEV__ = false;
  controls.length = 0;
  renderToStaticMarkup(React.createElement(SandboxControls));
  assert.ok(!controls.some((control) => control.accessibilityLabel === reset.accessibilityLabel));
  global.__DEV__ = true;
});

test('Schedule includes joined and followed teams; Discover excludes both, including mixed-team events', () => {
  for (const team of [teams.joined, teams.followed]) {
    assert.equal(eventBelongsInSection(event(0, team), viewer, 'schedule'), true);
    assert.equal(eventBelongsInSection(event(0, team), viewer, 'upcoming'), false);
  }
  assert.equal(eventBelongsInSection(event(0, teams.outside), viewer, 'schedule'), false);
  assert.equal(eventBelongsInSection(event(0, teams.outside), viewer, 'upcoming'), true);
  assert.equal(eventBelongsInSection(event(0, teams.outside, { teams: [teams.outside, teams.followed] }), viewer, 'upcoming'), false);
  for (const invalid of [undefined, [], [null], [{ id: 1, name: 'Invalid' }], [{ id: 'missing-name' }]]) {
    assert.equal(eventBelongsInSection(event(0, teams.outside, { teams: invalid }), viewer, 'upcoming'), false);
  }
});

test('both signed-out home views expose fake login beside the normal sign-in prompt in development', () => {
  for (const tab of ['for-you', 'discover']) {
    global.__DEV__ = true;
    const html = render(tab, { phase: 'signed-out', viewer: null });
    assert.match(html, /Sign in to see your team schedule/);
    assert.match(html, /Fake login \(dev\)/);
    assert.ok(controls.some((control) => control.accessibilityLabel === 'Fake login, preview sample events'));
    global.__DEV__ = false;
    assert.doesNotMatch(render(tab, { phase: 'signed-out', viewer: null }), /Fake login/);
  }
  delete global.__DEV__;
});

test('the adapter retains region visibility and followed-only schedules without treating every public event as Discovery', async () => {
  await assert.rejects(createHomeDataSource().loadViewer('jason'), HomeSetupError);
  const events = [event(0), event(1, teams.followed, { isTeamSpecific: false }), event(2, teams.outside), event(3, teams.outside, { region: 'south' }), event(-1, teams.outside)];
  const data = createHomeDataSource({
    loadViewer: async () => viewer,
    eventQueries: (user) => [source(events.filter((item) => item.region === user.region))],
    announcementQueries: () => [], readEvent: decode, readAnnouncement: () => null,
  });
  assert.deepEqual((await data.events(viewer, 'schedule', epoch, 5)).items.map((item) => item.id), [event(0).id, event(1).id]);
  assert.deepEqual((await data.events(viewer, 'upcoming', epoch, 5)).items.map((item) => item.id), [event(2).id]);
  assert.deepEqual((await data.events({ ...viewer, teamIds: [] }, 'schedule', epoch, 5)).items.map((item) => item.id), [event(1).id]);
});

test('five-item previews and paginated merged lists retain all events without duplicates', async () => {
  for (const count of [0, 1, 5, 6, 53]) {
    const items = Array.from({ length: count }, (_, n) => event(n));
    const streams = [source(items), source(items.filter((_, n) => n % 2 === 0))];
    const found = [];
    let cursor;
    let result;
    do {
      result = await readHomePage(streams, decode, compare, cursor ? 20 : 5, cursor);
      if (!cursor) { assert.equal(result.items.length, Math.min(5, count)); assert.equal(result.hasMore, count > 5); }
      found.push(...result.items.map((item) => item.id));
      cursor = result.cursor;
    } while (result.hasMore);
    assert.deepEqual(found, items.map((item) => item.id));
  }
});

test('Home scrolls, previews five/two events, and keeps See All unavailable until its owner supplies a route', () => {
  for (const [tab, section, label] of [['for-you', 'schedule', 'See all schedule'], ['discover', 'upcoming', 'See all upcoming events']]) {
    const html = render(tab);
    const cards = controls.filter((control) => control.type === 'Pressable' && control.accessibilityLabel?.startsWith('Practice'));
    assert.equal(cards.length, tab === 'for-you' ? 5 : 2);
    const scroll = controls.find((control) => control.type === 'FlatList');
    assert.equal(scroll.style.flex, 1);
    const seeAll = controls.find((control) => control.accessibilityLabel === label);
    assert.equal(seeAll.disabled, true);
    assert.equal(seeAll.onPress, undefined);
    assert.match(seeAll.accessibilityHint, /not available/);
    const otherTab = controls.find((control) => control.accessibilityRole === 'tab' && !control.accessibilityState.selected);
    otherTab.onPress();
    assert.equal(navigation.at(-1).params.view, tab === 'for-you' ? 'discover' : 'for-you');
    assert.equal(navigation.at(-1).params.focusTab, '1');
    assert.equal(html.includes('Teams Nearby'), tab === 'discover');
    if (tab === 'for-you') assert.equal(html.includes('Upcoming Events'), false);
    render(tab, {}, { eventList: (value) => ({ pathname: '/owner/events', params: { section: value } }) });
    const connected = controls.find((control) => control.accessibilityLabel === label);
    assert.equal(connected.disabled, false);
    connected.onPress();
    assert.deepEqual(navigation.at(-1), { pathname: '/owner/events', params: { section } });
  }
});

test('nearby cards hand live canonical IDs to existing Team Info, with Follow remaining a separate action', async () => {
  const { NearbyTeamCard } = load('src/components/home/NearbyTeamCard.tsx');
  const { homeDestinations } = load('src/config/homeDestinations.ts');
  const team = { id: 'team_203', name: 'River City Rockets', ageRange: 'All ages', city: 'Baltimore', distanceKm: 2 };
  const writes = [];
  dashboard = { state: { viewer }, destinations: homeDestinations, isPreview: false,
    source: { setTeamFollowed() {} }, followTeam: async (...args) => writes.push(args) };
  controls.length = 0;
  renderToStaticMarkup(React.createElement(NearbyTeamCard, { team }));
  const detail = controls.find((control) => control.accessibilityHint === 'Opens team details');
  assert.equal(detail.accessibilityRole, 'button');
  detail.onPress();
  assert.deepEqual(navigation.at(-1), { pathname: '/tabs/teams/[teamId]', params: { teamId: team.id } });
  assert.deepEqual(writes, [], 'opening Team Info must not change Follow');
  await controls.find((control) => control.accessibilityLabel === `Follow ${team.name}`).onPress();
  assert.deepEqual(writes, [[team.id, true]]);

  // Demo IDs must never reach the separate screen's live Firestore reader.
  dashboard.isPreview = true;
  controls.length = 0;
  renderToStaticMarkup(React.createElement(NearbyTeamCard, { team }));
  const demo = controls.find((control) => control.accessibilityHint?.includes('in this demo'));
  assert.equal(demo.disabled, true);
  assert.equal(demo.onPress, undefined);
  assert.equal(controls.find((control) => control.accessibilityLabel === `Follow ${team.name}`).disabled, false);
});

test('legacy See All links redirect to the correct Home view or a supplied sibling destination without rendering a list', () => {
  const ScheduleHandoff = load('src/app/tabs/home/schedule.tsx').default;
  const NearbyTeamsHandoff = load('src/app/tabs/home/nearby-teams.tsx').default;
  for (const [section, view] of [['schedule', 'for-you'], ['upcoming', 'discover'], ['announcements', 'for-you'], ['unknown', 'for-you']]) {
    dashboard = { destinations: {} };
    searchParams = { section };
    controls.length = 0;
    renderToStaticMarkup(React.createElement(ScheduleHandoff));
    assert.equal(controls.length, 1, 'handoff renders only a redirect');
    assert.deepEqual(controls[0].href, { pathname: '/tabs/home', params: { view } });
  }
  controls.length = 0;
  renderToStaticMarkup(React.createElement(NearbyTeamsHandoff));
  assert.deepEqual(controls[0].href, { pathname: '/tabs/home', params: { view: 'discover' } });
  dashboard.destinations = { eventList: (section) => ({ pathname: '/owner/events', params: { section } }), nearbyTeamList: '/owner/teams', announcementList: '/owner/announcements' };
  for (const section of ['schedule', 'upcoming', 'announcements']) {
    searchParams = { section };
    controls.length = 0;
    renderToStaticMarkup(React.createElement(ScheduleHandoff));
    assert.deepEqual(controls[0].href, section === 'announcements' ? '/owner/announcements' : { pathname: '/owner/events', params: { section } });
  }
  controls.length = 0;
  renderToStaticMarkup(React.createElement(NearbyTeamsHandoff));
  assert.equal(controls[0].href, '/owner/teams');
  searchParams = {};
});

test('team acronyms, full team names and relationship labels remain grouped in one event button at large text sizes', () => {
  assert.equal(teamAcronym(teams.joined), 'BB');
  assert.equal(teamAcronym(teams.followed), 'DC');
  assert.equal(teamAcronym({ ...teams.joined, acronym: 123 }), 'BB');
  for (const fontScale of [1, 2]) {
    dimensions = { ...dimensions, fontScale, width: fontScale > 1 ? 320 : 412 };
    controls.length = 0;
    const html = renderToStaticMarkup(React.createElement(EventCard, { event: event(0, teams.followed), viewer }));
    const buttons = controls.filter((control) => control.accessibilityRole === 'button');
    assert.equal(buttons.length, 1);
    assert.match(buttons[0].accessibilityLabel, /Dented Crew, Followed/);
    assert.ok(controls.filter((control) => control.importantForAccessibility === 'no-hide-descendants')
      .every((control) => control.accessibilityElementsHidden === true));
    assert.ok(html.includes('DC') && html.includes('Followed'));
    assert.equal(controls.some((control) => control.type === 'Image'), false);
  }
  dimensions = { ...dimensions, fontScale: 1, width: 412 };
});

test('notification labels distinguish unknown, zero and unread counts; both native tabs expose their position', () => {
  for (const count of [null, 0, 2]) {
    render('for-you', { unreadCount: count });
    const bell = controls.find((control) => control.accessibilityLabel?.startsWith('Notifications, '));
    assert.ok(bell);
    assert.match(bell.accessibilityLabel, count === null ? /unavailable/ : count === 0 ? /no new/ : /2 new notifications/);
    assert.equal(bell.disabled, true);
  }
  platform = 'ios';
  render('discover', { unreadCount: 2 });
  const bell = controls.find((control) => control.accessibilityLabel === 'Notifications');
  assert.equal(bell.accessibilityValue.text, '2 new notifications');
  const tab = controls.find((control) => control.accessibilityLabel === 'Discover');
  assert.equal(tab.accessibilityRole, 'button');
  assert.equal(tab.accessibilityValue.text, '2 of 2');
  platform = 'android';
  render('discover');
  const androidTab = controls.find((control) => control.accessibilityLabel === 'Discover');
  assert.equal(androidTab.accessibilityRole, 'tab');
  assert.equal(androidTab.accessibilityValue.text, '2 of 2');
  assert.equal(androidTab.accessibilityState.selected, true);
  assert.ok(controls.some((control) => control.accessibilityRole === 'tablist'));
  platform = 'web';
});

test('the logo uses the original bitmap with the exact Figma crop; the bell retains its slot dimensions', () => {
  render('for-you');
  const logo = controls.find((control) => control.accessibilityLabel === 'The Dented Puck Foundation');
  assert.equal(logo.accessibilityRole, 'image');
  assert.deepEqual(logo.style, { width: 99, height: 40, overflow: 'hidden' });
  const original = controls.find((control) => control.type === 'Image' && control.source.assetPath.endsWith('/originals/foundation-logo.png'));
  const svg = fs.readFileSync(path.resolve(__dirname, '../src/assets/home/svg/foundation-logo.svg'), 'utf8');
  const matrix = svg.match(/transform="matrix\(([^)]+)\)"/)[1].split(' ').map(Number);
  assert.equal(original.style.width, 99 * 1200 * matrix[0]);
  assert.equal(original.style.height, 40 * 480 * matrix[3]);
  assert.equal(original.style.left, 99 * matrix[4]);
  assert.equal(original.style.top, 40 * matrix[5]);
  assert.equal(original.accessible, false);
  assert.equal(original.importantForAccessibility, 'no');
  const bell = controls.find((control) => control.type === 'Image' && control.source.assetPath.endsWith('/notification-bell.png'));
  assert.deepEqual(bell.style, { width: 24, height: 24 });
});

test('switching focuses the selected segment after layout and cancels a pending focus when the screen blurs', () => {
  searchParams = { focusTab: '1' };
  for (const os of ['web', 'ios', 'android']) {
    platform = os;
    focusEvents.length = 0;
    render('discover');
    let focused = 0;
    const node = { focus() { focused++; } };
    const selected = controls.find((control) => control.type === 'Pressable' && control.accessibilityLabel === 'Discover');
    selected.ref.current = node;
    assert.equal(selected.focusable, true);
    const cleanup = focusEffects.at(-1)();
    assert.equal(focused, 0);
    assert.equal(focusEvents.length, 0);
    flushFrames();
    if (os === 'web') assert.equal(focused, 1);
    else assert.deepEqual(focusEvents, [{ node, event: 'focus' }]);
    cleanup();
    const onBlur = focusEffects.at(-1)();
    onBlur();
    flushFrames();
    assert.equal(os === 'web' ? focused : focusEvents.length, 1);
  }
  platform = 'web';
  searchParams = {};
  render('for-you');
  assert.equal(focusEffects.at(-1)(), undefined);
  assert.equal(frames.size, 0);
});

test('a mixed-team row retains every full name and relationship in one accessibility stop', () => {
  controls.length = 0;
  dimensions = { ...dimensions, width: 320, fontScale: 2 };
  const html = renderToStaticMarkup(React.createElement(EventCard, {
    event: event(0, teams.joined, { teams: [teams.joined, teams.followed, { ...teams.outside, acronym: 'A VERY LONG ACRONYM' }] }), viewer,
  }));
  const buttons = controls.filter((control) => control.accessibilityRole === 'button');
  assert.equal(buttons.length, 1);
  assert.match(buttons[0].accessibilityLabel, /Baltimore Blades, Joined, Dented Crew, Followed, Away Squad/);
  assert.ok(html.includes('BB') && html.includes('DC') && html.includes('A VERY LONG ACRONYM'));
  dimensions = { ...dimensions, width: 412, fontScale: 1 };
});

test('iOS announces an increased known count through a refresh without comparing different accounts', () => {
  platform = 'ios';
  announcements.length = 0;
  let previous = null;
  function update(count, uid = viewer.uid) {
    render('for-you', { unreadCount: count, viewer: uid ? { ...viewer, uid } : null });
    // Carry the ref as React does for a mounted header; effects are invoked
    // explicitly because static rendering does not execute client effects.
    headerRefs[0].current = previous;
    headerEffects[0]();
    previous = headerRefs[0].current;
  }
  update(0);
  update(null, null);
  update(2);
  assert.deepEqual(announcements, [{ message: 'Notifications, 2 new notifications', options: { queue: true } }]);
  update(2);
  update(1);
  update(5, 'another-account');
  assert.equal(announcements.length, 1);
  update(6, 'another-account');
  assert.equal(announcements.at(-1).message, 'Notifications, 6 new notifications');
  assert.equal(announcements.length, 2);
  platform = 'web';
});
