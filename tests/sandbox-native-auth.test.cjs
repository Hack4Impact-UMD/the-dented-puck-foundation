// Exercise Firebase's installed React Native Auth entry point and persistence
// boundary against the real local emulators. AsyncStorage's native bridge is
// represented by an in-memory store; native-device persistence is checked apart.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const { deleteApp } = require('firebase/app');
const { terminate } = require('firebase/firestore');
const { createLoader } = require('./helpers/load-sandbox.cjs');
const nativeAuth = require(path.resolve(__dirname, '../node_modules/@firebase/auth/dist/rn/index.js'));
const settings = require('../src/config/sandboxSettings.json');
const testSettings = { ...settings,
  authPort: Number(process.env.SANDBOX_TEST_AUTH_PORT ?? settings.authPort),
  firestorePort: Number(process.env.SANDBOX_TEST_FIRESTORE_PORT ?? settings.firestorePort),
};

for (const os of ['ios', 'android']) {
  test(`${os} uses React Native Auth persistence and restores the sandbox session`, { timeout: 20_000 }, async () => {
    // This file also runs independently, and the existing emulator may contain
    // fixtures dated before today. Seed before asserting an upcoming count.
    const { seedSandbox } = await import('../scripts/seed-sandbox.mjs');
    await seedSandbox(testSettings);
    global.__DEV__ = true;
    process.env.EXPO_PUBLIC_FIREBASE_SANDBOX = '1';
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = '127.0.0.1';
    const stored = new Map();
    const storage = {
      async setItem(key, value) { stored.set(key, value); },
      async getItem(key) { return stored.get(key) ?? null; },
      async removeItem(key) { stored.delete(key); },
    };
    const overrides = {
      './sandboxSettings.json': testSettings,
      'react-native': { Platform: { OS: os } },
      'expo-constants': { expoConfig: { hostUri: '127.0.0.1:8082' } },
      '@react-native-async-storage/async-storage': storage,
      'firebase/auth': nativeAuth,
    };
    let load = createLoader(overrides);
    let firebase = load('src/firebase/index.ts');
    try {
      const service = load('src/services/sandboxService.ts');
      await service.signInToSandbox();
      const uid = firebase.auth.currentUser.uid;
      const source = service.createSandboxHomeSource();
      const viewer = await source.loadViewer(uid);
      assert.equal((await source.events(viewer, 'schedule', new Date(), 20)).items.length, 8);
      assert.ok([...stored.keys()].some((key) => key.includes('dented-puck-sandbox')));
      assert.ok([...stored.keys()].every((key) => !key.includes('[DEFAULT]')));
      await terminate(firebase.db);
      await deleteApp(firebase.app);
      load = createLoader(overrides);
      firebase = load('src/firebase/index.ts');
      await firebase.auth.authStateReady();
      assert.equal(firebase.auth.currentUser.uid, uid);
      const restoredSource = load('src/services/sandboxService.ts').createSandboxHomeSource();
      const restoredViewer = await restoredSource.loadViewer(uid);
      await restoredSource.setTeamFollowed(restoredViewer, 'sandbox-rockets', true);
      const followedViewer = await restoredSource.loadViewer(uid);
      assert.ok(followedViewer.followedTeamIds.includes('sandbox-rockets'));
      const since = new Date();
      assert.equal((await restoredSource.events(followedViewer, 'schedule', since, 100)).items.length, 17);
      assert.equal((await restoredSource.events(followedViewer, 'upcoming', since, 100)).items.length, 17);
      assert.ok((await restoredSource.nearbyTeams(followedViewer)).some((team) => team.id === 'sandbox-rockets'));
      await restoredSource.resetPreviewFollows(followedViewer);
      await nativeAuth.signOut(firebase.auth);
      assert.equal(firebase.auth.currentUser, null);
      assert.ok(![...stored.keys()].some((key) => key.includes('authUser')));
    } finally {
      await terminate(firebase.db);
      await deleteApp(firebase.app);
    }
  });
}
