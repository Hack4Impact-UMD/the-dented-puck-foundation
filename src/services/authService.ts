import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { Platform } from 'react-native';
import { auth, db, storage } from '@/firebase';
import { birthdayToIso, validateAccountStep, type AccountForm } from '@/utils/validation';

export type AccountPhoto = { base64: string; mimeType: string } | null;

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

// Saves the authenticated user's onboarding profile and optional photo.
export async function saveAccountProfile(form: AccountForm, photo: AccountPhoto) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Sign in before saving your account.');
  const profile = { ...form, email: user.email };
  for (const step of [1, 2, 3] as const) {
    const error = Object.values(validateAccountStep(profile, step))[0];
    if (error) throw new Error(error);
  }

  let photoURL: string | undefined;
  if (photo) {
    const photoRef = ref(storage, `profile-photos/${user.uid}/avatar`);
    await uploadString(photoRef, photo.base64, 'base64', { contentType: photo.mimeType });
    photoURL = await getDownloadURL(photoRef);
  }

  await setDoc(doc(db, 'Users', user.uid), {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    gender: profile.gender,
    birthDate: birthdayToIso(profile.birthday),
    email: user.email,
    phoneNumber: profile.phoneNumber.replace(/\D/g, ''),
    usaHockeyNumber: profile.usaHockeyNumber.trim() || null,
    allowLocation: profile.allowLocation,
    ...(photoURL ? { photoURL } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
