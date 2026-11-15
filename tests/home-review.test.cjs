const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const firestore = require('firebase/firestore');
const { createLoader } = require('./helpers/load-sandbox.cjs');

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const rows = (items) => items.map((item) => ({ id: item.id, data: () => item }));
const snapshot = (items) => ({ docs: rows(items), size: items.length });
const profile = { exists: () => true, data: () => ({ username: 'Viewer', regionId: 1 }) };
const team = (id) => ({ id, name: id, teamId: 1, regionId: 1, coordinates: { latitude: 39, longitude: -76 } });
const viewer = { uid: 'viewer', name: 'Viewer', region: 1, teamIds: [], followedTeamIds: [],
  discoveryLocation: { latitude: 39, longitude: -76, source: 'device', label: 'Here' } };

function walk(element) {
  if (!element || typeof element !== 'object') return [];
  return [element, ...React.Children.toArray(element.props?.children).flatMap(walk)];
}

function tabsHarness(destinations = {}) {
  const assets = Object.fromEntries(['home', 'teams', 'chats', 'account'].map((name) => [`@/assets/home/${name}.png`, name]));
  const load = createLoader({
    ...assets,
    'react-native': { Platform: { OS: 'android' }, useWindowDimensions: () => ({ fontScale: 1 }) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-router': { Tabs: Object.assign(() => null, { Screen: 'Screen' }), router: { navigate: (href) => external.push(href) } },
    '@/hooks/useHomeDashboard': { HomeProvider: 'HomeProvider', useHomeDashboard: () => ({ destinations }) },
    '@/config/homeDestinations': { homeDestinations: {} },
  });
  const external = [];
  const layout = load('src/app/tabs/_layout.tsx').default();
  const dashboard = React.Children.toArray(layout.props.children)[1].type();
  const emitted = [];
  const navigated = [];
  let prevent = false;
  return {
    external, emitted, navigated,
    prevent() { prevent = true; },
    controls(routes = [{ name: 'home', key: 'home-key' }, { name: 'teams', key: 'teams-key' }]) {
      return walk(dashboard.props.tabBar({ state: { routes, index: 0 },
        emitter: { emit(event) { emitted.push(event); return { defaultPrevented: prevent }; } },
        navigateToTab: (key) => navigated.push(key),
      })).filter((element) => element.props?.accessibilityRole === 'tab').map((element) => element.props);
    },
  };
}

test('registered Teams tab works without a destination and preserves preventable tab navigation', () => {
  const tabs = tabsHarness();
  const controls = tabs.controls();
  const teams = controls.find((item) => item.accessibilityLabel === 'Teams');
  assert.equal(teams.disabled, false);
  assert.equal(teams.accessibilityState.disabled, false);
  assert.equal(teams.accessibilityHint, undefined);
  teams.onPress();
  assert.deepEqual(tabs.navigated, ['teams-key']);
  assert.deepEqual(tabs.emitted, [{ type: 'tabPress', target: 'teams-key', canPreventDefault: true }]);
  tabs.prevent();
  teams.onPress();
  assert.equal(tabs.navigated.length, 1);
  assert.equal(controls.find((item) => item.accessibilityLabel === 'Chats').disabled, true);
});

test('missing tab routes stay unavailable while destination-based controls retain their navigation', () => {
  const tabs = tabsHarness({ teams: '/external/teams', chats: '/owner/chats' });
  const controls = tabs.controls([{ name: 'home', key: 'home-key' }]);
  const teams = controls.find((item) => item.accessibilityLabel === 'Teams');
  assert.equal(teams.disabled, true);
  teams.onPress();
  assert.deepEqual(tabs.external, []);
  const chats = controls.find((item) => item.accessibilityLabel === 'Chats');
  assert.equal(chats.disabled, false);
  chats.onPress();
  assert.deepEqual(tabs.external, ['/owner/chats']);
});

function catalogHarness() {
  const catalogs = [];
  const profiles = [];
  const auth = { currentUser: { uid: viewer.uid } };
  const load = createLoader({
    '@/firebase': { auth, db: {} },
    'firebase/firestore': { ...firestore,
      collection: (_, name) => ({ name }), doc: () => ({}), query: (source) => source,
      getDoc: () => Promise.resolve(profiles.shift() ?? profile),
      getDocs: (source) => source.name === 'UserToTeam' ? Promise.resolve(snapshot([])) : catalogs.shift().promise,
    },
    '@/services/authService': {},
  });
  const source = load('src/services/firebaseHomeService.ts').createFirebaseHomeSource();
  return { source, profiles, start() { const result = deferred(); catalogs.push(result); return result; } };
}

test('out-of-order same-account viewer loads retain the latest catalog and the existing catalog while pending', async () => {
  const h = catalogHarness();
  const initial = h.start();
  const initialLoad = h.source.loadViewer(viewer.uid);
  initial.resolve(snapshot([team('initial')]));
  await initialLoad;
  const older = h.start();
  const olderLoad = h.source.loadViewer(viewer.uid);
  const newer = h.start();
  const newerLoad = h.source.loadViewer(viewer.uid);
  assert.deepEqual((await h.source.nearbyTeams(viewer)).map((item) => item.id), ['initial']);
  newer.resolve(snapshot([team('newest')]));
  const newestViewer = await newerLoad;
  assert.deepEqual(newestViewer.teamIds, [], 'an empty membership result remains valid');
  older.resolve(snapshot([team('stale')]));
  await olderLoad;
  assert.deepEqual((await h.source.nearbyTeams(viewer)).map((item) => item.id), ['newest']);
});

test('a failed newest viewer load does not let a superseded load replace the existing catalog', async () => {
  const h = catalogHarness();
  const initial = h.start();
  const initialLoad = h.source.loadViewer(viewer.uid);
  initial.resolve(snapshot([team('initial')]));
  await initialLoad;
  const older = h.start();
  const olderLoad = h.source.loadViewer(viewer.uid);
  h.profiles.push({ exists: () => false });
  const newest = h.start();
  const newestLoad = h.source.loadViewer(viewer.uid);
  newest.resolve(snapshot([team('newest')]));
  await assert.rejects(newestLoad, /profile not found/);
  older.resolve(snapshot([team('stale')]));
  await olderLoad;
  assert.deepEqual((await h.source.nearbyTeams(viewer)).map((item) => item.id), ['initial']);
});

function scanHarness() {
  let reads = 0;
  const fetchBatch = async (source, after, size) => {
    const start = after ? source.rows.findIndex((row) => row.id === after.id) + 1 : 0;
    const batch = source.rows.slice(start, start + size);
    reads += batch.length;
    return batch;
  };
  const load = createLoader({
    '@/services/authService': {},
    'firebase/firestore': { ...firestore, limit: (size) => ({ size }), startAfter: (after) => ({ after }),
      query: (source, ...constraints) => ({ ...source, ...Object.assign({}, ...constraints) }),
      getDocs: async (source) => ({ docs: await fetchBatch(source, source.after, source.size) }),
    },
  });
  return { ...load('src/services/homeService.ts'), fetchBatch, get reads() { return reads; } };
}
const since = new Date('2026-11-01T00:00:00Z');
const event = (n, nearby = false) => ({ id: `event-${String(n).padStart(3, '0')}`, title: `Event ${n}`, location: 'Rink',
  startTime: new Date(+since + n * 60_000), endTime: new Date(+since + (n + 1) * 60_000),
  isTeamSpecific: false, teams: [{ id: 'outside', name: 'Outside team' }],
  coordinates: nearby ? viewer.discoveryLocation : { latitude: 0, longitude: 0 } });

test('Discover resumes bounded scans past distant events and retains later nearby results', async () => {
  const h = scanHarness();
  const events = [...Array.from({ length: 250 }, (_, n) => event(n)), event(250, true), event(251, true)];
  const source = h.createHomeDataSource({ eventQueries: () => [{ rows: rows(events) }],
    readEvent: (id, data) => h.readHomeEvent(id, data, data.teams, data.coordinates) });
  let page;
  let cursor;
  const found = [];
  for (let n = 0; n < 3; n++) {
    const before = h.reads;
    page = await source.events(viewer, 'upcoming', since, 2, cursor);
    assert.ok(h.reads - before <= 100, 'each scan has a hard read bound');
    if (n < 2) {
      assert.deepEqual(page.items, []);
      assert.equal(page.hasMore, true);
      assert.equal(page.scanIncomplete, true);
    }
    found.push(...page.items.map((item) => item.id));
    cursor = page.cursor;
  }
  assert.deepEqual(found, ['event-250', 'event-251']);
  assert.equal(page.hasMore, false);
});

test('a paused stream cannot let another stream skip ahead in the merged order', async () => {
  const h = scanHarness();
  const early = { id: 'early', order: 101, eligible: true };
  const late = { id: 'late', order: 200, eligible: true };
  const streams = [{ rows: rows([...Array.from({ length: 100 }, (_, n) => ({ id: `far-${n}`, order: n, eligible: false })), early, late]) }, { rows: rows([late]) }];
  const read = (cursor) => h.readHomePage(streams, (_, data) => data, (a, b) => a.order - b.order,
    2, cursor, h.fetchBatch, (value) => value.eligible);
  const first = await read();
  assert.deepEqual(first.items, []);
  assert.equal(first.scanIncomplete, true);
  assert.equal(first.cursor.after[1], null, 'the later candidate must remain unconsumed');
  const next = await read(first.cursor);
  assert.deepEqual(next.items.map((item) => item.id), ['early', 'late']);
  assert.equal(next.hasMore, false);
});

test('partial pages resume without losing earlier matches, while malformed rows still fail explicitly', async () => {
  const h = scanHarness();
  const stream = { rows: rows([{ id: 'first', eligible: true },
    ...Array.from({ length: 100 }, (_, n) => ({ id: `far-${n}`, eligible: false })), { id: 'last', eligible: true }]) };
  const read = (cursor) => h.readHomePage([stream], (_, data) => data, () => 0, 2, cursor, h.fetchBatch, (value) => value.eligible);
  const first = await read();
  assert.deepEqual(first.items.map((item) => item.id), ['first']);
  assert.equal(first.scanIncomplete, true);
  const next = await read(first.cursor);
  assert.deepEqual(next.items.map((item) => item.id), ['last']);
  assert.equal(next.hasMore, false);
  await assert.rejects(h.readHomePage([{ rows: rows(Array.from({ length: 150 }, (_, n) => ({ id: `bad-${n}` }))) }],
    () => null, () => 0, 2, undefined, h.fetchBatch), /Too many invalid dashboard records/);
});

function sectionHarness(events) {
  let stored = null;
  let result = { loading: false, error: null, page: { items: [], hasMore: true, scanIncomplete: true, cursor: { after: ['first-scan'] } } };
  const dashboard = { state: { viewer, since, refreshing: false }, source: { events }, destinations: {}, isCurrentViewer: () => true };
  const load = createLoader({
    react: { ...React, useState: () => [stored, (value) => { stored = typeof value === 'function' ? value(stored) : value; }] },
    'react-native': { Text: 'Text', View: 'View' }, 'expo-router': { router: {} },
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => dashboard },
    ...Object.fromEntries(['EventCard', 'HomeMessage', 'HomeSeeAll', 'HomeTransition'].map((name) => [`@/components/home/${name}`, { [name]: name }])),
  });
  const { HomeSection } = load('src/components/home/HomeSection.tsx');
  return { dashboard, replace(page) { result = { ...result, page }; }, render() { return walk(HomeSection({ section: 'upcoming', result })).map((item) => item.props); } };
}

test('Home offers continuation instead of a false empty state and fills the two-event preview from its cursor', async () => {
  const calls = [];
  const response = deferred();
  const h = sectionHarness((...args) => { calls.push(args); return response.promise; });
  const controls = h.render();
  assert.equal(controls.some((item) => item.title === 'No upcoming regional events'), false);
  const pending = controls.find((item) => item.action === 'Find more events').onAction();
  assert.equal(h.render().find((item) => item.title === 'Looking for more events').loading, true);
  assert.equal(calls[0][3], 2);
  assert.deepEqual(calls[0][4], { after: ['first-scan'] });
  response.resolve({ items: [event(250, true), event(251, true)], hasMore: false, cursor: { after: [] } });
  await pending;
  const completed = h.render();
  assert.deepEqual(completed.filter((item) => item.event).map((item) => item.event.id), ['event-250', 'event-251']);
  assert.equal(completed.some((item) => item.action === 'Find more events'), false);
});

test('Home continuation can retry a failed scan and ignores responses after the location changes', async () => {
  const response = deferred();
  let fail = true;
  const h = sectionHarness(async () => { if (fail) throw new Error('offline'); return response.promise; });
  await h.render().find((item) => item.action === 'Find more events').onAction();
  assert.equal(h.render().some((item) => item.title === 'Unable to continue looking'), true);
  fail = false;
  const pending = h.render().find((item) => item.action === 'Find more events').onAction();
  h.dashboard.state.viewer = { ...viewer, discoveryLocation: { ...viewer.discoveryLocation, latitude: 40 } };
  h.replace({ items: [], hasMore: false, cursor: { after: [] } });
  h.render();
  response.resolve({ items: [event(250, true)], hasMore: false, cursor: { after: [] } });
  await pending;
  assert.equal(h.render().some((item) => item.event), false);
});

test('Home retains partial results and only requests the missing preview item', async () => {
  const calls = [];
  const h = sectionHarness(async (...args) => {
    calls.push(args);
    return { items: [event(251, true)], hasMore: true, cursor: { after: ['last-match'] } };
  });
  h.replace({ items: [event(250, true)], hasMore: true, scanIncomplete: true, cursor: { after: ['partial-scan'] } });
  const controls = h.render();
  assert.deepEqual(controls.filter((item) => item.event).map((item) => item.event.id), ['event-250']);
  await controls.find((item) => item.action === 'Find more events').onAction();
  assert.equal(calls[0][3], 1);
  assert.deepEqual(calls[0][4], { after: ['partial-scan'] });
  assert.deepEqual(h.render().filter((item) => item.event).map((item) => item.event.id), ['event-250', 'event-251']);
  assert.equal(h.render().some((item) => item.label === 'See all upcoming events'), true);
});
