import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '@/firebase';

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
