import Constants from 'expo-constants';
import { Platform } from 'react-native';
import settings from './sandboxSettings.json';

const requested = process.env.EXPO_PUBLIC_FIREBASE_SANDBOX === '1';

// A preview build must never silently switch to a real Firebase project.
if (requested && !__DEV__) {
  throw new Error('The Firebase sandbox is only available in development.');
}

export const isSandbox = requested && __DEV__;
export const sandboxSettings = settings;

export function sandboxHost(): string {
  const override = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (override) return override;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }
  // Expo's LAN host also works from a phone on the same network.
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
}
