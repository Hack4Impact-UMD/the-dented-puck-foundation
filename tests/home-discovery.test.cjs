const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./helpers/load-sandbox.cjs');

function setup() {
  global.__DEV__ = true;
  const storage = new Map();
  const load = createLoader({
    '@react-native-async-storage/async-storage': {
      async getItem(key) { return storage.get(key) ?? null; },
      async setItem(key, value) { storage.set(key, value); },
      async removeItem(key) { storage.delete(key); },
    },
    '@/services/authService': { async getUserProfile() { throw new Error('Discovery preview must not access production profiles.'); } },
  });
  return { load, storage, ...load('src/services/homePreviewService.ts'), ...load('src/utils/homeLocation.ts') };
}

test('nearby ranking and event eligibility change with coordinates, excluding missing and distant points', async () => {
  const { createHomePreviewSource, HOME_PREVIEW_UID, distanceKm, validCoordinates } = setup();
  const source = createHomePreviewSource();
  const viewer = await source.loadViewer(HOME_PREVIEW_UID);
  const nearby = await source.nearbyTeams(viewer);
  assert.equal(nearby.length, 4);
  assert.ok(nearby.some((team) => team.name === 'River City Rockets'));
  assert.ok(nearby.every((team, i) => team.distanceKm <= 100 && (!i || team.distanceKm >= nearby[i - 1].distanceKm)));
  const frederick = { ...viewer, discoveryLocation: { latitude: 39.4143, longitude: -77.4105, label: 'Frederick, MD', source: 'manual' } };
  assert.equal((await source.nearbyTeams(frederick))[0].name, 'Frederick Foxes');
  const far = { ...viewer, discoveryLocation: { latitude: 37.5407, longitude: -77.436, label: 'Richmond, VA', source: 'manual' } };
  assert.deepEqual(await source.nearbyTeams(far), []);
  assert.equal((await source.events(far, 'upcoming', new Date(), 20)).items.length, 0);
  assert.equal((await source.events(far, 'schedule', new Date(), 20)).items.length, 8);
  assert.equal(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
  assert.ok(Math.abs(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) - 111.195) < 0.01);
  for (const invalid of [null, {}, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: NaN }, { latitude: '39', longitude: 0 }]) assert.equal(validCoordinates(invalid), false);
  const { eventBelongsInSection } = setup().load('src/utils/homeEvents.ts');
  assert.equal(eventBelongsInSection({ teams: [{ id: 'outside', name: 'Unknown coordinates' }] }, viewer, 'upcoming'), false);
});

test('two-event preview and full pagination retain the same location and ordering', async () => {
  const { createHomePreviewSource, HOME_PREVIEW_UID } = setup();
  const source = createHomePreviewSource();
  const viewer = await source.loadViewer(HOME_PREVIEW_UID);
  const since = new Date();
  const preview = await source.events(viewer, 'upcoming', since, 2);
  const first = await source.events(viewer, 'upcoming', since, 20);
  const next = await source.events(viewer, 'upcoming', since, 20, first.cursor);
  assert.equal(preview.items.length, 2);
  assert.equal(preview.hasMore, true);
  assert.deepEqual(preview.items.map((event) => event.id), first.items.slice(0, 2).map((event) => event.id));
  assert.equal(new Set([...first.items, ...next.items].map((event) => event.id)).size, 26);
});

test('Follow persists per dev account and moves all matching events, including multi-team events, into Schedule', async () => {
  const { load, createHomePreviewSource, HOME_PREVIEW_UID } = setup();
  const source = createHomePreviewSource();
  const initial = await source.loadViewer(HOME_PREVIEW_UID);
  const nearby = (await source.nearbyTeams(initial)).filter((team) => !initial.followedTeamIds.includes(team.id));
  await source.setTeamFollowed(initial, nearby[0].id, true);
  // A fresh source models re-entry/reload and reads the device-local preference.
  const restoredSource = createHomePreviewSource();
  const restored = await restoredSource.loadViewer(HOME_PREVIEW_UID);
  assert.ok(restored.followedTeamIds.includes(nearby[0].id));
  assert.ok((await restoredSource.nearbyTeams(restored)).some((team) => team.id === nearby[0].id));
  const schedule = await restoredSource.events(restored, 'schedule', new Date(), 100);
  const discovery = await restoredSource.events(restored, 'upcoming', new Date(), 100);
  assert.ok(schedule.items.length > 8);
  assert.equal(schedule.items.length + discovery.items.length, 34);
  assert.ok(schedule.items.some((event) => event.id === 'discover-04' && event.teams.length === 2));
  assert.ok(discovery.items.every((event) => event.teams.every((team) => team.id !== nearby[0].id)));
  // A second stale UI callback must merge the first persisted Follow.
  await source.setTeamFollowed(initial, nearby[1].id, true);
  const both = await source.loadViewer(HOME_PREVIEW_UID);
  assert.ok(both.followedTeamIds.includes(nearby[0].id) && both.followedTeamIds.includes(nearby[1].id));
  const { loadDevFollows } = load('src/services/devDiscoveryService.ts');
  assert.deepEqual(await loadDevFollows('another-account', []), []);
  await source.setTeamFollowed(both, nearby[0].id, false);
  const unfollowed = await source.loadViewer(HOME_PREVIEW_UID);
  assert.ok(!unfollowed.followedTeamIds.includes(nearby[0].id));
  await assert.rejects(source.setTeamFollowed(initial, initial.teamIds[0], true), /cannot be followed/);
  await assert.rejects(source.setTeamFollowed(initial, 'invented-team', true), /cannot be followed/);
});

test('following every nearby team retains the team cards and every event; reset restores the original feeds', async () => {
  const { load, createHomePreviewSource, HOME_PREVIEW_UID, storage } = setup();
  const source = createHomePreviewSource();
  const initial = await source.loadViewer(HOME_PREVIEW_UID);
  const since = new Date();
  const nearbyBefore = await source.nearbyTeams(initial);
  const eventsBefore = [...(await source.events(initial, 'schedule', since, 100)).items, ...(await source.events(initial, 'upcoming', since, 100)).items];
  for (const team of nearbyBefore) await source.setTeamFollowed(initial, team.id, true);
  const followed = await source.loadViewer(HOME_PREVIEW_UID);
  assert.deepEqual(await source.nearbyTeams(followed), nearbyBefore);
  assert.equal((await source.events(followed, 'upcoming', new Date(), 100)).items.length, 0);
  const byId = (a, b) => a.id.localeCompare(b.id);
  assert.deepEqual((await source.events(followed, 'schedule', since, 100)).items.sort(byId), eventsBefore.sort(byId));
  storage.set('@dented-puck/dev-follows/other-account', '["sandbox-ice"]');

  await source.resetPreviewFollows(followed);
  const restored = await createHomePreviewSource().loadViewer(HOME_PREVIEW_UID);
  assert.deepEqual(restored.teamIds, initial.teamIds);
  assert.deepEqual(restored.followedTeamIds, initial.followedTeamIds);
  assert.deepEqual(await source.nearbyTeams(restored), nearbyBefore);
  assert.equal((await source.events(restored, 'schedule', new Date(), 100)).items.length, 8);
  assert.equal((await source.events(restored, 'upcoming', new Date(), 100)).items.length, 26);
  assert.equal(storage.get('@dented-puck/dev-follows/other-account'), '["sandbox-ice"]');
  await assert.rejects(source.resetPreviewFollows({ ...restored, uid: 'other-account' }), /Invalid preview account/);
  global.__DEV__ = false;
  const { resetDevFollows } = load('src/services/devDiscoveryService.ts');
  await assert.rejects(resetDevFollows(HOME_PREVIEW_UID), /unavailable in release/);
  global.__DEV__ = true;
});
