const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { initializeApp, deleteApp } = require('firebase/app');
const { createUserWithEmailAndPassword, deleteUser, getAuth } = require('firebase/auth');
const { deleteDoc, doc, getFirestore, setDoc, terminate } = require('firebase/firestore');

test('deployed cloud rules deny self-appointed privileged roles', {
  skip: process.env.FIREBASE_LIVE_RULES_TEST !== '1', timeout: 30_000,
}, async () => {
  const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter((line) => line.includes('=') && !line.startsWith('#')).map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
  assert.equal(env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'denton-puck');
  const app = initializeApp({ projectId: 'denton-puck', apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY }, 'cloud-rules-check');
  const auth = getAuth(app);
  const db = getFirestore(app);
  let temporaryUser;
  let createdProfile = false;
  try {
    const result = await createUserWithEmailAndPassword(auth, `qa.rules.${Date.now()}@dentedpuck.test`, 'TemporaryRulesCheck9!');
    temporaryUser = result.user;
    for (const role of ['global-admin', 'super-admin', 'team-staff']) {
      await assert.rejects((async () => {
        await setDoc(doc(db, 'Users', temporaryUser.uid), { role, username: 'Temporary rules QA' });
        createdProfile = true;
      })(), (error) => error.code === 'permission-denied');
    }
  } finally {
    // If a regression allowed the fixture role, remove only that newly created
    // profile while its temporary account still holds its own test session.
    if (createdProfile) await deleteDoc(doc(db, 'Users', temporaryUser.uid));
    if (temporaryUser) await deleteUser(temporaryUser);
    await terminate(db);
    await deleteApp(app);
  }
});
