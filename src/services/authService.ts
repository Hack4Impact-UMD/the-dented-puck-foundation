import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '@/firebase';

const USERS_COLLECTION = 'users';

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
    await createUserProfile(user.uid, user.email ?? email.trim());
  } catch (err) {
    // Roll back so the user can retry 
    await user.delete().catch(() => {});
    throw err;
  }

  try {
    await sendEmailVerification(user);
  } catch {
    // the verify-email screen can resend
  }

  return user;
}

export async function createUserProfile(uid: string, email: string) {
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    email,
    createdAt: serverTimestamp(),
  });
}

// For providers like Google, where the Auth account may exist before the profile does.
export async function ensureUserProfile(user: FirebaseUser) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, user.uid));
  if (!snapshot.exists()) {
    await createUserProfile(user.uid, user.email ?? '');
  }
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
