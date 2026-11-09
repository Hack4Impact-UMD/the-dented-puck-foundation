// Run with npm run sandbox already running. No cloud credentials are used.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { createLoader } from './helpers/load-sandbox.cjs';
import { seedSandbox, settings } from '../scripts/seed-sandbox.mjs';

// Match the CommonJS SDK instances used by the TypeScript loader.
const require = createRequire(import.meta.url);
const { deleteApp } = require('firebase/app');
const { collection, deleteDoc, doc, getDocs, getDocFromServer, updateDoc, terminate } = require('firebase/firestore');
const { signOut } = require('firebase/auth');
const testSettings = { ...settings,
  authPort: Number(process.env.SANDBOX_TEST_AUTH_PORT ?? settings.authPort),
  firestorePort: Number(process.env.SANDBOX_TEST_FIRESTORE_PORT ?? settings.firestorePort),
};

test('real emulator login, scoped feeds, pagination, reseeding and access rules', { timeout: 45_000 }, async () => {
  globalThis.__DEV__ = true;
  process.env.EXPO_PUBLIC_FIREBASE_SANDBOX = '1';
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = '127.0.0.1';
  const localPreferences = new Map();
  const load = createLoader({
    './sandboxSettings.json': testSettings,
    'expo-constants': { expoConfig: {} },
    'react-native': { Platform: { OS: 'web' } },
    '@react-native-async-storage/async-storage': { async getItem(key) { return localPreferences.get(key) ?? null; }, async setItem(key, value) { localPreferences.set(key, value); } },
  });
  const { app, auth, db } = load('src/firebase/index.ts');
  try {
    const seeded = await seedSandbox(testSettings);
    const { signInToSandbox, createSandboxHomeSource } = load('src/services/sandboxService.ts');
    const source = createSandboxHomeSource();
    await signInToSandbox();
    assert.equal(auth.currentUser.uid, seeded.uid);
    assert.equal(app.options.projectId, 'demo-dented-puck');
    const viewer = await source.loadViewer(auth.currentUser.uid);
    assert.equal(viewer.name, 'Abir');
    assert.equal(await source.notificationCount(viewer), 3);
    const since = new Date();
    const preview = await source.events(viewer, 'schedule', since, 5);
    assert.equal(preview.items.length, 5);
    assert.equal(preview.hasMore, true);
    const schedule = await source.events(viewer, 'schedule', since, 20);
    assert.equal(schedule.items.length, 8);
    assert.equal(schedule.hasMore, false);
    assert.deepEqual(preview.items.map((event) => event.id), schedule.items.slice(0, 5).map((event) => event.id));
    const discoveryPreview = await source.events(viewer, 'upcoming', since, 5);
    assert.equal(discoveryPreview.items.length, 5);
    assert.equal(discoveryPreview.hasMore, true);
    const first = await source.events(viewer, 'upcoming', since, 20);
    const second = await source.events(viewer, 'upcoming', since, 20, first.cursor);
    assert.equal(first.hasMore, true);
    assert.equal(first.items.length, 20);
    assert.equal(second.hasMore, false);
    assert.equal(second.items.length, 6);
    const all = [...first.items, ...second.items];
    assert.equal(new Set(all.map((event) => event.id)).size, 26);
    const affiliated = new Set([...viewer.teamIds, ...viewer.followedTeamIds]);
    assert.ok(all.every((event) => event.teams.every((team) => !affiliated.has(team.id))));
    assert.ok(all.every((event, index) => index === 0 || all[index - 1].startTime <= event.startTime));
    assert.equal((await source.announcements(viewer, 5)).items.length, 0);

    const again = await seedSandbox(testSettings);
    assert.equal(again.uid, seeded.uid);
    assert.equal((await source.events(viewer, 'upcoming', since, 100)).items.length, 26);
    const nearbyBefore = await source.nearbyTeams(viewer);
    assert.equal(nearbyBefore.length, 4);
    const nearby = nearbyBefore.filter((team) => !viewer.followedTeamIds.includes(team.id));
    const viewerRef = doc(db, 'SandboxViewers', viewer.uid);
    const readViewer = async () => (await getDocFromServer(viewerRef)).data();
    const before = await readViewer();
    const readFixtures = async () => {
      const feeds = await Promise.all(['schedule', 'upcoming'].map(async (section) =>
        (await getDocs(collection(db, 'SandboxViewers', viewer.uid, section))).docs.map((row) => [row.ref.path, row.data()])));
      return feeds.flat().sort(([a], [b]) => a.localeCompare(b));
    };
    const fixturesBefore = await readFixtures();
    // Old device-local sandbox choices must not override Firestore's viewer.
    localPreferences.set(`@dented-puck/dev-follows/${viewer.uid}`, '["sandbox-foxes"]');
    await source.setTeamFollowed(viewer, nearby[0].id, true);
    const followed = await source.loadViewer(viewer.uid);
    assert.ok(followed.followedTeamIds.includes(nearby[0].id));
    assert.deepEqual(await readViewer(), { ...before, followedTeamIds: [...before.followedTeamIds, nearby[0].id] });
    const updatedSchedule = await source.events(followed, 'schedule', since, 100);
    const updatedDiscovery = await source.events(followed, 'upcoming', since, 100);
    assert.equal(updatedSchedule.items.length, 17);
    assert.equal(updatedDiscovery.items.length, 17);
    assert.ok(updatedDiscovery.items.every((event) => event.teams.every((team) => team.id !== nearby[0].id)));
    assert.deepEqual(await source.nearbyTeams(followed), nearbyBefore);
    assert.deepEqual(await readFixtures(), fixturesBefore, 'Follow must not change any stored event or team metadata');
    assert.deepEqual(new Set([...updatedSchedule.items, ...updatedDiscovery.items].map((event) => event.id)),
      new Set([...schedule.items, ...all].map((event) => event.id)));

    // Repeated and stale callbacks/devices merge membership atomically.
    await Promise.all([source.setTeamFollowed(viewer, nearby[0].id, true), source.setTeamFollowed(viewer, nearby[1].id, true)]);
    assert.deepEqual(new Set((await readViewer()).followedTeamIds), new Set([...before.followedTeamIds, nearby[0].id, nearby[1].id]));
    await source.setTeamFollowed(viewer, nearby[0].id, false);
    assert.deepEqual(new Set((await readViewer()).followedTeamIds), new Set([...before.followedTeamIds, nearby[1].id]));
    for (const team of nearby) await source.setTeamFollowed(viewer, team.id, true);
    const followedAll = await source.loadViewer(viewer.uid);
    assert.equal((await source.events(followedAll, 'schedule', since, 100)).items.length, 34);
    assert.equal((await source.events(followedAll, 'upcoming', since, 100)).items.length, 0);
    assert.deepEqual(await source.nearbyTeams(followedAll), nearbyBefore);
    await source.resetPreviewFollows(followedAll);
    assert.deepEqual(await readViewer(), before);
    assert.deepEqual(await readFixtures(), fixturesBefore, 'Follow, Unfollow and Reset must preserve every stored event');
    assert.equal((await source.events(await source.loadViewer(viewer.uid), 'upcoming', since, 100)).items.length, 26);

    await assert.rejects(getDocFromServer(doc(db, 'SandboxViewers', 'someone-else')), { code: 'permission-denied' });
    await assert.rejects(source.setTeamFollowed({ ...viewer, uid: 'someone-else' }, nearby[0].id, true), /Sign in before/);
    await assert.rejects(source.setTeamFollowed(viewer, viewer.teamIds[0], true), /cannot be followed/);
    await assert.rejects(source.setTeamFollowed(viewer, 'unknown-team', true), /cannot be followed/);
    await assert.rejects(updateDoc(doc(db, 'SandboxViewers', 'someone-else'), { followedTeamIds: [nearby[0].id] }), { code: 'permission-denied' });
    await assert.rejects(updateDoc(viewerRef, { unreadCount: 0 }), { code: 'permission-denied' });
    await assert.rejects(updateDoc(viewerRef, { followedTeamIds: ['unknown-team'] }), { code: 'permission-denied' });
    await assert.rejects(updateDoc(viewerRef, { followedTeamIds: viewer.teamIds }), { code: 'permission-denied' });
    const eventRef = doc(db, 'SandboxViewers', viewer.uid, 'upcoming', all[0].id);
    await assert.rejects(updateDoc(eventRef, { title: 'Changed' }), { code: 'permission-denied' });
    await assert.rejects(deleteDoc(eventRef), { code: 'permission-denied' });
    await assert.rejects(deleteDoc(viewerRef), { code: 'permission-denied' });
    await assert.rejects(updateDoc(doc(db, 'Users', viewer.uid), { username: 'Changed' }), { code: 'permission-denied' });
    await signOut(auth);
    await assert.rejects(source.setTeamFollowed(viewer, nearby[0].id, true), /Sign in before/);
    await assert.rejects(getDocFromServer(doc(db, 'SandboxViewers', viewer.uid)), { code: 'permission-denied' });
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
});
