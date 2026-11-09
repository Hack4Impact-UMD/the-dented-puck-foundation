// Opt-in cloud checks against the dedicated QA account. Follow tests restore
// that account's initial preferences; no existing community data is changed.
// Credentials
// stay in ignored .sandbox/firebase-qa.env, never EXPO_PUBLIC_* or app source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { createLoader } = require('./helpers/load-sandbox.cjs');

test('cloud QA login, scoped feeds, pagination, Follow persistence and isolation', {
  skip: process.env.FIREBASE_LIVE_TEST !== '1', timeout: 30_000,
}, async () => {
  function readEnv(file) {
    return Object.fromEntries(fs.readFileSync(file, 'utf8').split('\n').filter((line) => line && !line.startsWith('#')).map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
  }
  const env = readEnv('.env');
  assert.equal(env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'denton-puck');
  const qa = readEnv('.sandbox/firebase-qa.env');
  assert.match(qa.QA_EMAIL, /^qa\.home\..+@dentedpuck\.test$/);
  Object.assign(process.env, env, { EXPO_PUBLIC_FIREBASE_SANDBOX: '0' });
  globalThis.__DEV__ = true;
  const load = createLoader({
    'react-native': { Platform: { OS: 'web' } },
    'expo-constants': { expoConfig: {} },
    '@react-native-async-storage/async-storage': {},
  });
  const { app, auth, db } = load('src/firebase/index.ts');
  const { getUserProfile } = load('src/services/authService.ts');
  const { collection, doc, getDoc, getDocs, query, where, terminate } = require('firebase/firestore');
  const { signInWithEmailAndPassword, signOut } = require('firebase/auth');
  try {
    assert.equal(auth.emulatorConfig, null);
    await assert.rejects(signInWithEmailAndPassword(auth, qa.QA_EMAIL, 'incorrect-password'), (error) => error.code === 'auth/invalid-credential');
    const { user } = await signInWithEmailAndPassword(auth, qa.QA_EMAIL, qa.QA_PASSWORD);
    assert.equal(user.uid, qa.QA_UID);
    assert.equal(user.emailVerified, true);
    const profile = await getUserProfile(user.uid);
    assert.equal(profile.role, 'player');
    const events = await getDocs(query(collection(db, 'Events'), where('regionId', '==', profile.regionId)));
    assert.equal(events.size, 34);
    const originalEvents = events.docs.map((snapshot) => [snapshot.id, snapshot.data()]);
    const { createFirebaseHomeSource } = load('src/services/firebaseHomeService.ts');
    const source = createFirebaseHomeSource();
    const initial = await source.loadViewer(user.uid);
    assert.equal(initial.region, 9901109);
    assert.equal(initial.teamIds.length, 1);
    assert.equal(initial.followedTeamIds.length, 1);
    const viewer = { ...initial, discoveryLocation: { label: 'Baltimore, MD', source: 'manual', latitude: 39.2904, longitude: -76.6122 } };
    const since = new Date();
    const schedule = await source.events(viewer, 'schedule', since, 20);
    const preview = await source.events(viewer, 'schedule', since, 5);
    assert.equal(schedule.items.length, 8);
    assert.deepEqual(preview.items.map((item) => item.id), schedule.items.slice(0, 5).map((item) => item.id));
    assert.equal(preview.hasMore, true);
    const first = await source.events(viewer, 'upcoming', since, 20);
    const second = await source.events(viewer, 'upcoming', since, 20, first.cursor);
    assert.equal(first.items.length, 20);
    assert.equal(first.hasMore, true);
    assert.equal(second.items.length, 6);
    assert.equal(second.hasMore, false);
    assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 26);
    assert.equal((await source.events(viewer, 'upcoming', since, 2)).items.length, 2);
    const nearby = await source.nearbyTeams(viewer);
    assert.equal(nearby.length, 3);
    assert.ok(nearby.every((team, i) => i === 0 || nearby[i - 1].distanceKm <= team.distanceKm));
    const targets = nearby.filter((team) => !initial.followedTeamIds.includes(team.id));
    try {
      // Stale viewer objects must merge concurrent/sequential preferences.
      for (const team of targets) await source.setTeamFollowed(viewer, team.id, true);
      const saved = await source.loadViewer(user.uid);
      assert.equal(saved.followedTeamIds.length, 3);
      assert.equal((await getDoc(doc(db, 'Users', user.uid))).data().followedTeamIds.length, 3);
      assert.equal((await source.events(saved, 'schedule', since, 100)).items.length, 34);
      assert.equal((await source.events(saved, 'upcoming', since, 100)).items.length, 0);
      assert.deepEqual((await source.nearbyTeams({ ...saved, discoveryLocation: viewer.discoveryLocation })).map((team) => team.id), nearby.map((team) => team.id));
      const restored = createFirebaseHomeSource();
      assert.equal((await restored.loadViewer(user.uid)).followedTeamIds.length, 3);
      await assert.rejects(source.setTeamFollowed(viewer, viewer.teamIds[0], true));
      await assert.rejects(source.loadViewer('another-account'), (error) => error.code === 'permission-denied');
    } finally {
      for (const team of targets) await source.setTeamFollowed(viewer, team.id, false);
    }
    const reset = await source.loadViewer(user.uid);
    assert.deepEqual(reset.followedTeamIds, initial.followedTeamIds);
    const catalog = await source.searchCatalog({ ...reset, discoveryLocation: viewer.discoveryLocation }, since);
    assert.equal(catalog.schedule.length, 8);
    assert.equal(catalog.upcoming.length, 26);
    assert.ok(catalog.upcoming.some((event) => event.title.includes('Season kickoff')));
    const after = await getDocs(query(collection(db, 'Events'), where('regionId', '==', profile.regionId)));
    assert.deepEqual(after.docs.map((snapshot) => [snapshot.id, snapshot.data()]), originalEvents);
    await assert.rejects(getDoc(doc(db, 'Users', 'user_1201')), (error) => error.code === 'permission-denied');
    await signOut(auth);
    assert.equal(auth.currentUser, null);
    await assert.rejects(getDocs(query(collection(db, 'Events'), where('regionId', '==', profile.regionId))), (error) => error.code === 'permission-denied');
  } finally {
    await signOut(auth);
    await terminate(db);
    await require('firebase/app').deleteApp(app);
  }
});
