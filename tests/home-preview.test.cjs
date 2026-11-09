const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createLoader } = require('./helpers/load-sandbox.cjs');

const load = createLoader({
  '@react-native-async-storage/async-storage': { async getItem() { return null; }, async setItem() {} },
  '@/services/authService': { async getUserProfile() { throw new Error('Preview must not read a real user profile.'); } },
});
const { createHomePreviewSource, HOME_PREVIEW_UID } = load('src/services/homePreviewService.ts');

test('regular Expo Go fake login has complete sample feeds without Firebase sign-in or reads', async () => {
  global.__DEV__ = true;
  const source = createHomePreviewSource();
  const viewer = await source.loadViewer(HOME_PREVIEW_UID);
  const since = new Date();
  assert.equal(viewer.name, 'Abir');
  const preview = await source.events(viewer, 'schedule', since, 5);
  const schedule = await source.events(viewer, 'schedule', since, 20);
  assert.equal(preview.items.length, 5);
  assert.equal(preview.hasMore, true);
  assert.equal(schedule.items.length, 8);
  assert.equal(schedule.hasMore, false);
  assert.deepEqual(preview.items.map((event) => event.id), schedule.items.slice(0, 5).map((event) => event.id));
  const affiliated = new Set([...viewer.teamIds, ...viewer.followedTeamIds]);
  assert.ok(schedule.items.every((event) => event.teams.some((team) => affiliated.has(team.id))));
  const first = await source.events(viewer, 'upcoming', since, 20);
  const next = await source.events(viewer, 'upcoming', since, 20, first.cursor);
  assert.equal(first.items.length, 20);
  assert.equal(first.hasMore, true);
  assert.equal(next.items.length, 6);
  assert.equal(next.hasMore, false);
  assert.equal(new Set([...first.items, ...next.items].map((event) => event.id)).size, 26);
  assert.ok([...first.items, ...next.items].every((event) => event.teams.every((team) => !affiliated.has(team.id))));
  assert.equal(await source.notificationCount(viewer), 3);
  await assert.rejects(source.loadViewer('real-account'), /Invalid preview account/);
});

test('iOS and Android fake login buttons enter the preview in place', async () => {
  global.__DEV__ = true;
  for (const platform of ['ios', 'android']) {
    const buttons = [];
    let logins = 0;
    let navigations = 0;
    const host = (tag) => ({ children, ...props }) => {
      if (tag === 'button') buttons.push(props);
      return React.createElement(tag, null, children);
    };
    const ui = createLoader({
      'react-native': { Platform: { OS: platform }, View: host('div'), Text: host('span'), Pressable: host('button') },
      '@/hooks/useHomeDashboard': { useHomeDashboard: () => ({ enterPreview: async () => { logins++; } }) },
      'expo-router': { router: { push() { navigations++; }, replace() { navigations++; } } },
    });
    const { DevLoginButton } = ui('src/components/dev/DevLoginButton.tsx');
    const html = renderToStaticMarkup(React.createElement(DevLoginButton));
    assert.match(html, /Fake login \(dev\)/);
    assert.equal(buttons.length, 1);
    assert.equal(buttons[0].accessibilityRole, 'button');
    await buttons[0].onPress();
    assert.equal(logins, 1);
    assert.equal(navigations, 0);
    global.__DEV__ = false;
    buttons.length = 0;
    assert.equal(renderToStaticMarkup(React.createElement(DevLoginButton)), '');
    assert.equal(buttons.length, 0);
    global.__DEV__ = true;
  }
});

test('a release build cannot enter the local fake account', () => {
  global.__DEV__ = false;
  assert.throws(() => createHomePreviewSource(), /only available in development/);
});
