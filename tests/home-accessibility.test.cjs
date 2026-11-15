const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { createLoader } = require('./helpers/load-sandbox.cjs');

// Controlled host hooks verify speech/focus dispatch, not native reader output.
function mount(t, file, name, props, { platform = 'ios', nativeOverrides = {}, overrides = {}, contextValue = (context) => context._currentValue } = {}) {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  t.mock.method(global, 'setTimeout', (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + delay });
    return id;
  });
  t.mock.method(global, 'clearTimeout', (id) => timers.delete(id));
  t.mock.method(global, 'requestAnimationFrame', (callback) => setTimeout(callback, 16));
  t.mock.method(global, 'cancelAnimationFrame', (id) => clearTimeout(id));
  const speech = [];
  const focus = [];
  const hooks = [];
  let cursor = 0;
  let effects = [];
  let focused = true;
  let current;
  let rendering = false;
  let dirty = false;
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    ...React,
    useContext(context) { return contextValue(context); },
    useRef(initial) { return hooks[cursor++] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, (next) => {
        const value = typeof next === 'function' ? next(hooks[index].value) : next;
        if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; render(); }
      }];
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
      hooks[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
    },
  };
  const load = createLoader({
    react,
    'react-native': {
      ...Object.fromEntries(['Text', 'View', 'Pressable', 'TextInput', 'Image', 'ActivityIndicator'].map((type) => [type, type])),
      Platform: { OS: platform },
      AccessibilityInfo: {
        announceForAccessibilityWithOptions: (message, options) => speech.push({ message, options }),
        sendAccessibilityEvent: (node, event) => focus.push({ node, event }),
        isScreenReaderEnabled: async () => true,
      },
      AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
      ...nativeOverrides,
    },
    'expo-router': { useFocusEffect: (callback) => react.useEffect(() => focused ? callback() : undefined, [callback, focused]) },
    ...overrides,
  });
  const component = load(file)[name];
  function render() {
    if (rendering) { dirty = true; return; }
    rendering = true;
    do {
      dirty = false;
      cursor = 0;
      effects = [];
      current = component(props);
      for (const effect of effects) effect();
    } while (dirty);
    rendering = false;
  }
  render();
  return {
    get current() { return current; }, speech, focus,
    update(next) { props = next; render(); },
    blur() { focused = false; render(); },
    refocus() { focused = true; render(); },
    dispose() { for (const hook of hooks) hook?.cleanup?.(); },
    advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= now && timers.delete(id)) timer.callback();
    },
  };
}

// Node does not expose animation-frame globals. The host supplies them per test.
global.requestAnimationFrame ??= () => {};
global.cancelAnimationFrame ??= () => {};

function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(elements);
  return [tree, ...elements(tree.props?.children)];
}

for (const platform of ['ios', 'android']) {
  test(`${platform} sends debounced replaceable search feedback, and cancels pending speech on blur/unmount`, (t) => {
    const props = { children: '2 events found', accessibilityLabel: 'All events, 2 events found for skate', delay: 600 };
    const mounted = mount(t, 'src/components/home/HomeStatusText.tsx', 'HomeStatusText', props, { platform });
    assert.equal(mounted.current.props.accessibilityLiveRegion, undefined, 'native uses a single speech path');
    mounted.advance(599);
    assert.equal(mounted.speech.length, 0);
    mounted.update({ ...props, accessibilityLabel: 'Nearby events, 2 events found for practice' });
    mounted.advance(599);
    assert.equal(mounted.speech.length, 0);
    mounted.advance(1);
    assert.deepEqual(mounted.speech, [{ message: 'Nearby events, 2 events found for practice', options: { queue: false, priority: 'low' } }]);
    mounted.update({ ...props, accessibilityLabel: 'Nearby events, 2 events found for practice' });
    mounted.advance(1000);
    assert.equal(mounted.speech.length, 1, 'unchanged counts do not repeat');
    mounted.update({ ...props, children: 'No matches found', accessibilityLabel: undefined });
    mounted.blur();
    mounted.advance(1000);
    assert.equal(mounted.speech.length, 1);
    mounted.dispose();
  });
}

test('location status skips its initial value, then speaks changes; web keeps a polite live region', (t) => {
  const props = { children: 'Baltimore, MD', announceOnMount: false };
  const mounted = mount(t, 'src/components/home/HomeStatusText.tsx', 'HomeStatusText', props);
  mounted.advance(1000);
  assert.equal(mounted.speech.length, 0);
  mounted.update({ ...props, children: 'Frederick, MD' });
  mounted.advance(300);
  assert.equal(mounted.speech.at(-1).message, 'Frederick, MD');
  mounted.update({ ...props, children: 'Current location' });
  mounted.dispose();
  mounted.advance(300);
  assert.equal(mounted.speech.length, 1, 'unmount discards pending speech');
});

test('web status text exposes one polite live region and sends no native announcement', (t) => {
  const mounted = mount(t, 'src/components/home/HomeStatusText.tsx', 'HomeStatusText', { children: 'No matches found' }, { platform: 'web' });
  assert.equal(mounted.current.props.accessibilityLiveRegion, 'polite');
  assert.equal(mounted.current.props.role, 'status');
  mounted.advance(1000);
  assert.equal(mounted.speech.length, 0);
});

test('loading/error feedback includes the explanation and keeps its action outside the status', (t) => {
  const mounted = mount(t, 'src/components/home/HomeMessage.tsx', 'HomeMessage', {
    title: 'Unable to load events', message: 'Check your connection.', action: 'Try again', onAction() {},
  });
  mounted.advance(300);
  assert.equal(mounted.speech.at(-1).message, 'Unable to load events. Check your connection.');
  assert.equal(elements(mounted.current).filter((node) => node.props?.accessibilityRole === 'button').length, 1);
});

for (const platform of ['ios', 'android']) {
  test(`${platform} starts at the laid-out title after auth settles and restores it on a real reopen`, async (t) => {
    let appChange;
    let removed = 0;
    const props = { ready: false, identity: 'signed-out', blocked: false };
    const mounted = mount(t, 'src/hooks/useHomeTitleFocus.ts', 'useHomeTitleFocus', props, { platform, nativeOverrides: {
      AppState: { currentState: 'active', addEventListener(event, callback) {
        assert.equal(event, 'change'); appChange = callback; return { remove() { ++removed; } };
      } },
    } });
    const title = { name: 'Welcome back, Abir' };
    mounted.current.title.current = title;
    mounted.advance(1000);
    assert.equal(mounted.focus.length, 0);
    assert.equal(mounted.current.pending, true, 'feed controls wait for the entry focus handoff');
    mounted.current.onTitleLayout();
    mounted.update({ ...props, ready: true, identity: 'abir' });
    await Promise.resolve();
    mounted.advance(16);
    assert.deepEqual(mounted.focus, [{ node: title, event: 'focus' }]);
    assert.equal(mounted.current.pending, false);
    assert.deepEqual(mounted.speech, [], 'focus speaks the title without a duplicate announcement');
    mounted.update({ ready: true, identity: 'abir', blocked: false });
    mounted.advance(1000);
    assert.equal(mounted.focus.length, 1, 'ordinary feed updates never steal focus');
    appChange('inactive'); appChange('active');
    await Promise.resolve(); mounted.advance(16);
    assert.equal(mounted.focus.length, 1, 'closing permission prompts preserves the current control');
    appChange('background'); appChange('active');
    await Promise.resolve(); mounted.advance(16);
    assert.equal(mounted.focus.length, 2);
    mounted.blur();
    assert.equal(removed, 1);
    appChange('background'); appChange('active');
    await Promise.resolve(); mounted.advance(16);
    assert.equal(mounted.focus.length, 2, 'an inactive Home cannot focus over a sibling screen');
    mounted.dispose();
  });
}

test('title focus cancels stale reader checks on blur, account changes and search entry', async (t) => {
  const reads = [];
  const mounted = mount(t, 'src/hooks/useHomeTitleFocus.ts', 'useHomeTitleFocus', { ready: true, identity: 'a', blocked: false }, {
    nativeOverrides: { AccessibilityInfo: {
      isScreenReaderEnabled: () => new Promise((resolve) => reads.push(resolve)),
      sendAccessibilityEvent() { assert.fail('a stale title request must never focus'); },
    } },
  });
  mounted.current.title.current = {};
  mounted.current.onTitleLayout();
  mounted.update({ ready: true, identity: 'b', blocked: false });
  reads[0](true);
  await Promise.resolve(); mounted.advance(16);
  mounted.update({ ready: true, identity: 'b', blocked: true });
  reads[1](true);
  await Promise.resolve(); mounted.advance(16);
  mounted.blur(); mounted.refocus();
  reads[2](true);
  await Promise.resolve(); mounted.advance(16);
  mounted.update({ ready: true, identity: 'c', blocked: false });
  mounted.blur();
  reads[3](true);
  await Promise.resolve(); mounted.advance(16);
  mounted.dispose();
});

test('title focus leaves ordinary users alone and releases the feed when the reader is disabled', async (t) => {
  const mounted = mount(t, 'src/hooks/useHomeTitleFocus.ts', 'useHomeTitleFocus', { ready: true, identity: 'a', blocked: false }, {
    nativeOverrides: { AccessibilityInfo: { isScreenReaderEnabled: async () => false,
      sendAccessibilityEvent() { assert.fail('reader disabled'); } } },
  });
  mounted.current.title.current = {};
  mounted.current.onTitleLayout();
  await Promise.resolve(); mounted.advance(1000);
  assert.equal(mounted.current.pending, false);
  mounted.dispose();
});

test('opening search while title focus is pending releases the feed without moving focus', async (t) => {
  const mounted = mount(t, 'src/hooks/useHomeTitleFocus.ts', 'useHomeTitleFocus', { ready: true, identity: 'a', blocked: false });
  mounted.current.title.current = {};
  mounted.current.onTitleLayout();
  await Promise.resolve();
  mounted.update({ ready: true, identity: 'a', blocked: true });
  mounted.advance(16);
  assert.deepEqual(mounted.focus, []);
  assert.equal(mounted.current.pending, false);
  mounted.dispose();
});

test('child status speech waits until the title focus scope permits announcements', (t) => {
  let allowed = false;
  const mounted = mount(t, 'src/components/home/HomeStatusText.tsx', 'HomeStatusText', { children: 'Unable to load events' }, {
    contextValue: () => allowed,
  });
  mounted.advance(1000);
  assert.deepEqual(mounted.speech, []);
  allowed = true;
  mounted.update({ children: 'Unable to load events' });
  mounted.advance(300);
  assert.equal(mounted.speech.length, 1);
  mounted.dispose();
});

test('passive feed messages stay readable without announcing ahead of the opening title', (t) => {
  const mounted = mount(t, 'src/components/home/HomeMessage.tsx', 'HomeMessage', {
    title: 'Loading upcoming events', loading: true, announce: false,
  });
  mounted.advance(1000);
  assert.deepEqual(mounted.speech, []);
  assert.ok(elements(mounted.current).some((node) => node.props?.children === 'Loading upcoming events'));
  mounted.update({ title: 'No upcoming regional events', announce: false });
  mounted.advance(1000);
  assert.deepEqual(mounted.speech, []);
  mounted.update({ title: 'Unable to load events', message: 'Check your connection.', announce: true });
  mounted.advance(300);
  assert.equal(mounted.speech[0].message, 'Unable to load events. Check your connection.');
  mounted.dispose();
});

test('Cancel and Clear return native reader focus to search without reopening it on Cancel', (t) => {
  let opened = 0;
  let keyboardFocus = 0;
  let cleared;
  const props = { query: '', returnFocusRequest: 0, onFocus() { ++opened; }, onChangeQuery(value) { cleared = value; } };
  const mounted = mount(t, 'src/components/home/HomeSearchField.tsx', 'HomeSearchField', props, {
    overrides: { '@/assets/home/search.png': {} },
  });
  const field = () => elements(mounted.current).find((node) => node.type === 'TextInput');
  const node = { focus() { ++keyboardFocus; } };
  field().props.ref.current = node;
  mounted.update({ ...props, returnFocusRequest: 1 });
  mounted.advance(16);
  assert.deepEqual(mounted.focus, [{ node, event: 'focus' }]);
  assert.equal(keyboardFocus, 0, 'reader focus does not reopen the keyboard');
  assert.equal(opened, 0);
  mounted.update({ ...props, returnFocusRequest: 1 });
  mounted.advance(16);
  assert.equal(mounted.focus.length, 1, 'a consumed return request never repeats');
  mounted.update({ ...props, query: 'skate', returnFocusRequest: 1 });
  elements(mounted.current).find((item) => item.props?.accessibilityLabel === 'Clear search').props.onPress();
  mounted.update({ ...props, returnFocusRequest: 1 });
  mounted.advance(16);
  assert.equal(cleared, '');
  assert.equal(keyboardFocus, 1);
  assert.equal(mounted.focus.length, 2, 'the disappearing Clear button leaves focus on the field');
  mounted.update({ ...props, returnFocusRequest: 2 });
  mounted.blur(); mounted.advance(16);
  assert.equal(mounted.focus.length, 2);
  mounted.dispose();
});

test('returning web keyboard focus after Cancel does not reopen search, but the next user focus does', (t) => {
  let opened = 0;
  const props = { query: '', returnFocusRequest: 0, onFocus() { ++opened; } };
  const mounted = mount(t, 'src/components/home/HomeSearchField.tsx', 'HomeSearchField', props, {
    platform: 'web', overrides: { '@/assets/home/search.png': {} },
  });
  const field = () => elements(mounted.current).find((node) => node.type === 'TextInput');
  field().props.ref.current = { focus() { field().props.onFocus(); } };
  mounted.update({ ...props, returnFocusRequest: 1 });
  mounted.advance(16);
  assert.equal(opened, 0);
  field().props.onFocus();
  assert.equal(opened, 1);
  mounted.dispose();
});

test('successful Follow and Unfollow announce the team and destination of its events', async (t) => {
  const team = { id: 'rockets', name: 'River City Rockets', city: 'Baltimore', ageRange: 'All ages', distanceKm: 2 };
  let followed = false;
  const mounted = mount(t, 'src/components/home/NearbyTeamCard.tsx', 'NearbyTeamCard', { team }, { overrides: {
    '@/components/team/TeamIcon': () => null,
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({
      state: { viewer: { teamIds: [], followedTeamIds: followed ? [team.id] : [] } },
      source: { setTeamFollowed() {} }, followTeam: async (_, value) => { followed = value; },
      destinations: {},
    }) },
  } });
  const button = () => elements(mounted.current).find((node) => /^(Unfollow|Follow) River City Rockets$/.test(node.props?.accessibilityLabel));
  await button().props.onPress();
  mounted.advance(300);
  assert.match(mounted.speech.at(-1).message, /Following River City Rockets.*schedule/);
  assert.equal(button().props.accessibilityLabel, 'Unfollow River City Rockets');
  await button().props.onPress();
  mounted.advance(300);
  assert.match(mounted.speech.at(-1).message, /Unfollowed River City Rockets.*Discover/);
});

test('team-detail handoff waits for the Home Follow write to finish', async (t) => {
  const team = { id: 'team_203', name: 'River City Rockets', city: 'Baltimore', ageRange: 'All ages', distanceKm: 2 };
  let finish;
  const routes = [];
  const mounted = mount(t, 'src/components/home/NearbyTeamCard.tsx', 'NearbyTeamCard', { team }, { overrides: {
    '@/components/team/TeamIcon': () => null,
    '@/hooks/useHomeAnnouncement': { useHomeAnnouncement() {} },
    'expo-router': { router: { push: (href) => routes.push(href) } },
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({
      state: { viewer: { teamIds: [], followedTeamIds: [] } },
      destinations: { team: (teamId) => ({ pathname: '/tabs/teams/[teamId]', params: { teamId } }) },
      source: { setTeamFollowed() {} }, followTeam: () => new Promise((resolve) => { finish = resolve; }),
    }) },
  } });
  const detail = () => elements(mounted.current).find((node) => node.props?.accessibilityHint === 'Opens team details');
  assert.equal(detail().props.disabled, false);
  const follow = elements(mounted.current).find((node) => node.props?.accessibilityLabel === `Follow ${team.name}`);
  const saving = follow.props.onPress();
  assert.equal(detail().props.disabled, true);
  assert.equal(detail().props.accessibilityState.busy, true);
  assert.equal(detail().props.onPress, undefined);
  assert.deepEqual(routes, []);
  finish();
  await saving;
  assert.equal(detail().props.disabled, false);
  detail().props.onPress();
  assert.deepEqual(routes, [{ pathname: '/tabs/teams/[teamId]', params: { teamId: team.id } }]);
  mounted.dispose();
});

test('device location requests expose pending state and discard results after blur', async (t) => {
  let resolveLocation;
  let selected;
  const mounted = mount(t, 'src/components/home/DiscoveryLocationControl.tsx', 'DiscoveryLocationControl', {}, { overrides: {
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({ state: { viewer: {} }, setDiscoveryLocation: (location) => { selected = location; } }) },
    '@/services/discoveryLocationService': { requestDiscoveryLocation: () => new Promise((resolve) => { resolveLocation = resolve; }) },
  } });
  const device = () => elements(mounted.current).find((node) => node.props?.accessibilityLabel === 'Use my location for nearby events and teams');
  assert.equal(elements(mounted.current).filter((node) => node.props?.accessibilityRole === 'button').length, 1);
  const pending = device().props.onPress();
  assert.equal(device().props.accessibilityState.busy, true);
  assert.equal(device().props.disabled, true);
  mounted.blur();
  resolveLocation({ label: 'Stale GPS result', source: 'device' });
  await pending;
  assert.equal(selected, undefined);
  assert.equal(device().props.accessibilityState.busy, false);
  mounted.dispose();
});
