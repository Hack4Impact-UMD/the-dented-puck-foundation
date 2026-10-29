import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, db } from '@/firebase';
import type { Role } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  return doc(db, 'Users', uid);
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

// TODO: Implement Apple sign-in.
export async function signInWithApple(): Promise<FirebaseUser> {
  throw new Error('Apple sign-in is not available yet.');
}

// Creates the Auth account then sends the verification email.
export async function signUpWithEmail(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);

  try {
    await sendEmailVerification(user);
  } catch {
    // the verify-email screen can resend
  }

  return user;
}

export type AuthErrorField = 'email' | 'form';

export interface AuthFormError {
  field: AuthErrorField;
  message: string;
  code?: string;
}

// Maps Firebase errors to a message and the field it belongs under.
export function getAuthFormError(err: unknown): AuthFormError {
  if (!(err instanceof FirebaseError)) {
    return {
      field: 'form',
      message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    };
  }

  const { code } = err;
  switch (code) {
    case 'auth/email-already-in-use':
      return { field: 'email', code, message: 'An account with this email already exists.' };
    case 'auth/invalid-email':
      return { field: 'email', code, message: 'Enter a valid email address, like name@example.com.' };
    case 'auth/network-request-failed':
      return { field: 'form', code, message: 'No internet connection. Check your connection and try again.' };
    case 'auth/too-many-requests':
      return { field: 'form', code, message: 'Too many attempts. Wait a moment and try again.' };
    default:
      return { field: 'form', code, message: 'Something went wrong. Please try again.' };
  }
}
