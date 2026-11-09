// Uses local emulators only. See docs/firebase-final-checks.md for the command.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc, terminate, updateDoc } from 'firebase/firestore';

const enabled = process.env.FIREBASE_RULES_TEST === '1';

test('production rules reject self-appointed admins and preserve player onboarding', { skip: !enabled, timeout: 30_000 }, async () => {
  const projectId = 'demo-dented-puck';
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  assert.match(authHost ?? '', /^127\.0\.0\.1:\d+$/);
  assert.match(firestoreHost ?? '', /^127\.0\.0\.1:\d+$/);
  const app = initializeApp({ projectId, apiKey: 'rules-test-only', appId: 'rules-test-only' }, 'rules-test');
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  const db = getFirestore(app);
  const [host, port] = firestoreHost.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  try {
    const { user } = await createUserWithEmailAndPassword(auth, 'rules-regression@dentedpuck.test', 'RulesTest9!');
    const own = doc(db, 'Users', user.uid);
    for (const role of ['global-admin', 'super-admin', 'team-staff']) {
      await assert.rejects(setDoc(own, { role }), (error) => error.code === 'permission-denied');
    }
    await setDoc(own, { role: 'player', username: 'Rules QA', regionId: 1 });
    await assert.rejects(updateDoc(own, { role: 'global-admin' }), (error) => error.code === 'permission-denied');
    await assert.rejects(getDoc(doc(db, 'Users', 'another-user')), (error) => error.code === 'permission-denied');
    await assert.rejects(setDoc(doc(db, 'Events', 'unauthorized-event'), { title: 'Must fail' }), (error) => error.code === 'permission-denied');
    await updateDoc(own, { username: 'Updated player' });
    const verified = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:update?key=rules-test-only`, {
      method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: user.uid, emailVerified: true }),
    });
    assert.equal(verified.ok, true);
    await user.getIdToken(true);
    assert.equal((await getDoc(own)).data().username, 'Updated player');
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
});
