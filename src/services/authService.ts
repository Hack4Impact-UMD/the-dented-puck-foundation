import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '@/firebase';
import type { Role } from '@/types';

export interface UserProfile {
  age: number;
  email: string;
  'phone-number': string;
  regionId: number;
  role: Role;
  userId: number;
  username: string;
}

const roles: Role[] = ['global-admin', 'super-admin', 'team-staff', 'player', 'contact'];

function isRole(value: unknown): value is Role {
  return roles.some((role) => role === value);
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.age === 'number' &&
    typeof profile.email === 'string' &&
    typeof profile['phone-number'] === 'string' &&
    typeof profile.regionId === 'number' &&
    typeof profile.userId === 'number' &&
    typeof profile.username === 'string' &&
    isRole(profile.role)
  );
}

function userProfileRef(uid: string) {
  if (!uid.trim()) {
    throw new Error('A Firebase Auth UID is required to access a user profile.');
  }

  return doc(db, 'users', uid);
}

export async function createUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(userProfileRef(uid), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const profileSnapshot = await getDoc(userProfileRef(uid));
  if (!profileSnapshot.exists()) {
    throw new Error('User profile not found for the signed-in account.');
  }

  const profile: unknown = profileSnapshot.data();
  if (!isUserProfile(profile)) {
    throw new Error('The user profile in Firestore has an invalid format.');
  }

  return profile;
}

export async function resendVerificationEmail(
  user: FirebaseUser | null = auth.currentUser,
): Promise<void> {
  if (!user) {
    throw new Error('Sign in before requesting an email verification link.');
  }
  if (!user.email) {
    throw new Error('The signed-in account does not have an email address.');
  }
  if (user.emailVerified) {
    throw new Error('This email address is already verified.');
  }

  await sendEmailVerification(user);
}

// Signs in or creates a Firebase Auth user. Does not write to Firestore.
export async function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    throw new Error('Google sign-in is currently available in the web app.');
  }

  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}
