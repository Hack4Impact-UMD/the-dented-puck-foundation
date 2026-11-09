const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { createLoader } = require('./helpers/load-sandbox.cjs');

// Controlled host hooks verify speech/focus dispatch, not native reader output.
function mount(t, file, name, props, { platform = 'ios', overrides = {} } = {}) {
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
      ...Object.fromEntries(['Text', 'View', 'Pressable', 'ActivityIndicator'].map((type) => [type, type])),
      Platform: { OS: platform },
      AccessibilityInfo: {
        announceForAccessibilityWithOptions: (message, options) => speech.push({ message, options }),
        sendAccessibilityEvent: (node, event) => focus.push({ node, event }),
      },
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
  test(`${platform} queues the latest search count after typing, and cancels pending speech on blur/unmount`, (t) => {
    const props = { children: '2 events found', accessibilityLabel: 'All events, 2 events found for skate', delay: 600 };
    const mounted = mount(t, 'src/components/home/HomeStatusText.tsx', 'HomeStatusText', props, { platform });
    assert.equal(mounted.current.props.accessibilityLiveRegion, undefined, 'native uses a single speech path');
    mounted.advance(599);
    assert.equal(mounted.speech.length, 0);
    mounted.update({ ...props, accessibilityLabel: 'Nearby events, 2 events found for practice' });
    mounted.advance(599);
    assert.equal(mounted.speech.length, 0);
    mounted.advance(1);
    assert.deepEqual(mounted.speech, [{ message: 'Nearby events, 2 events found for practice', options: { queue: true } }]);
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
  const props = { children: 'Baltimore (demo location)', announceOnMount: false };
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

test('successful Follow and Unfollow announce the team and destination of its events', async (t) => {
  const team = { id: 'rockets', name: 'River City Rockets', city: 'Baltimore', ageRange: 'All ages', distanceKm: 2 };
  let followed = false;
  const mounted = mount(t, 'src/components/home/NearbyTeamCard.tsx', 'NearbyTeamCard', { team }, { overrides: {
    '@/components/team/TeamIcon': () => null,
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({
      state: { viewer: { teamIds: [], followedTeamIds: followed ? [team.id] : [] } },
      source: { setTeamFollowed() {} }, followTeam: async (_, value) => { followed = value; },
      destinations: {}, isPreview: true,
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
      state: { viewer: { teamIds: [], followedTeamIds: [] } }, isPreview: false,
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

test('manual city choice returns focus to Change location; blur cancels pending focus and location reads', async (t) => {
  let resolveLocation;
  let selected;
  const mounted = mount(t, 'src/components/home/DiscoveryLocationControl.tsx', 'DiscoveryLocationControl', {}, { overrides: {
    '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({ state: { viewer: {} }, setDiscoveryLocation: (city) => { selected = city; } }) },
    '@/services/discoveryLocationService': { requestDiscoveryLocation: () => new Promise((resolve) => { resolveLocation = resolve; }) },
  } });
  const change = () => elements(mounted.current).find((node) => node.props?.accessibilityLabel === 'Change discovery location');
  const node = {};
  change().props.ref.current = node;
  change().props.onPress();
  const city = () => elements(mounted.current).find((node) => node.props?.accessibilityLabel?.startsWith('Use Frederick'));
  city().props.onPress();
  assert.equal(selected.source, 'manual');
  assert.equal(change().props.accessibilityState.expanded, false);
  mounted.advance(16);
  assert.deepEqual(mounted.focus, [{ node, event: 'focus' }]);
  change().props.onPress();
  city().props.onPress();
  const device = elements(mounted.current).find((node) => node.props?.accessibilityLabel === 'Use my location for nearby events and teams');
  const pending = device.props.onPress();
  mounted.blur();
  resolveLocation({ label: 'Stale GPS result' });
  await pending;
  mounted.advance(1000);
  assert.equal(mounted.focus.length, 1);
  assert.equal(selected.source, 'manual');
});
