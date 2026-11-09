const assert = require('node:assert/strict');
const { test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase/app');
const { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } = require('firebase/auth');
const { collection, connectFirestoreEmulator, getDocs, getFirestore, terminate } = require('firebase/firestore');
const { createLoader } = require('./helpers/load-sandbox.cjs');

test('live Home mapping handles numeric IDs, UID memberships, visibility and atomic follows', {
  skip: process.env.FIREBASE_HOME_EMULATOR_TEST !== '1', timeout: 30_000,
}, async () => {
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  assert.match(authHost ?? '', /^127\.0\.0\.1:\d+$/);
  assert.match(firestoreHost ?? '', /^127\.0\.0\.1:\d+$/);
  const app = initializeApp({ projectId: 'demo-dented-puck', apiKey: 'test-only' }, 'live-home-test');
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  const db = getFirestore(app);
  const [host, port] = firestoreHost.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  const base = `http://${firestoreHost}/v1/projects/demo-dented-puck/databases/(default)/documents/`;
  function encode(value) {
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
    if (typeof value === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])) } };
    if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    return typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value };
  }
  async function seed(path, data) {
    const response = await fetch(base + path, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify(encode(data).mapValue) });
    assert.equal(response.ok, true);
  }
  try {
    const { user } = await createUserWithEmailAndPassword(auth, 'live-home@dentedpuck.test', 'MappingTest9!');
    await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:update?key=test-only`, {
      method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: user.uid, emailVerified: true }),
    });
    await user.getIdToken(true);
    const coordinates = { latitude: 39.29, longitude: -76.61 };
    await seed(`Users/${user.uid}`, { role: 'player', username: 'Live QA', reigonId: 1, followedTeamIds: ['team_202'] });
    await seed(`UserToTeam/${user.uid}_team_201`, { userId: user.uid, teamId: 'team_201', status: 'active' });
    await seed(`UserToTeam/${user.uid}_inactive`, { userId: user.uid, teamId: 203, status: 'inactive' });
    for (const id of [201, 202, 203]) await seed(`Teams/team_${id}`, { teamId: id, reigonId: 1, status: 'active', name: `Team ${id}`, coordinates, city: 'Baltimore' });
    await seed('Teams/team_204', { teamId: 204, reigonId: 1, status: 'inactive', name: 'Inactive team' });
    const since = new Date();
    async function event(id, teamIds, extra = {}) {
      const startTime = new Date(+since + 86_400_000);
      await seed(`Events/${id}`, { title: id, teamIds, regionId: 1, isTeamSpecific: false, startTime, endTime: new Date(+startTime + 3_600_000), location: 'QA rink', coordinates, ...extra });
    }
    await event('a-multi-joined', [201, 203]);
    await event('b-private-joined', [201], { isTeamSpecific: true });
    await event('c-private-followed', [202], { isTeamSpecific: true });
    await event('d-discover', [203]);
    await event('e-other-region', [203], { regionId: 2 });
    await event('f-private-unaffiliated', [203], { isTeamSpecific: true });
    await event('g-unknown-team', [999]);
    await event('h-inactive-team', [204]);
    await event('i-past', [203], { startTime: new Date(+since - 7_200_000), endTime: new Date(+since - 3_600_000) });
    const load = createLoader({ '@/firebase': { app, auth, db }, 'react-native': { Platform: { OS: 'web' } } });
    const source = load('src/services/firebaseHomeService.ts').createFirebaseHomeSource();
    const viewer = await source.loadViewer(user.uid);
    assert.equal(viewer.region, 1);
    assert.deepEqual(viewer.teamIds, ['team_201']);
    assert.deepEqual((await source.events(viewer, 'schedule', since, 20)).items.map((e) => e.id), ['a-multi-joined', 'b-private-joined', 'c-private-followed']);
    assert.deepEqual((await source.events(viewer, 'upcoming', since, 20)).items.map((e) => e.id), ['d-discover']);
    const before = (await getDocs(collection(db, 'Events'))).docs.map((d) => [d.id, d.data()]);
    await source.setTeamFollowed(viewer, 'team_203', true);
    const followed = await source.loadViewer(user.uid);
    assert.equal((await source.events(followed, 'schedule', since, 20)).items.length, 6);
    assert.equal((await source.events(followed, 'upcoming', since, 20)).items.length, 0);
    const located = { ...followed, discoveryLocation: { ...coordinates, label: 'Baltimore', source: 'manual' } };
    assert.equal((await source.nearbyTeams(located)).length, 2);
    await assert.rejects(source.setTeamFollowed(viewer, 'team_201', true));
    await assert.rejects(source.setTeamFollowed({ ...viewer, uid: 'other-user' }, 'team_203', false));
    await source.setTeamFollowed(viewer, 'team_203', false);
    assert.deepEqual((await source.loadViewer(user.uid)).followedTeamIds, ['team_202']);
    assert.deepEqual((await getDocs(collection(db, 'Events'))).docs.map((d) => [d.id, d.data()]), before);
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
});
