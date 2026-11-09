import { FirebaseError } from 'firebase/app';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  connectAuthEmulator,
  // @ts-expect-error getReactNativePersistence is provided by React Native bundle of firebase/auth
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isSandbox, sandboxHost, sandboxSettings } from '@/config/sandbox';

const firebaseConfig = isSandbox ? {
  apiKey: 'sandbox-only-api-key',
  authDomain: `${sandboxSettings.projectId}.firebaseapp.com`,
  projectId: sandboxSettings.projectId,
  storageBucket: `${sandboxSettings.projectId}.firebasestorage.app`,
  appId: '1:1234567890:web:sandbox',
} : {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Separate app/auth persistence keeps real sessions out of the sandbox.
const appName = isSandbox ? 'dented-puck-sandbox' : '[DEFAULT]';
const existingApp = getApps().find((candidate) => candidate.name === appName);
export const app: FirebaseApp = existingApp ? getApp(appName) : initializeApp(firebaseConfig, appName);

export const auth: Auth = (() => {
  if (Platform.OS === 'web') return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
})();

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

if (isSandbox && !existingApp) {
  const host = sandboxHost();
  // The persistent sandbox controls identify this environment without covering
  // the app's bottom navigation with Firebase's web warning banner.
  connectAuthEmulator(auth, `http://${host}:${sandboxSettings.authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, sandboxSettings.firestorePort);
}
