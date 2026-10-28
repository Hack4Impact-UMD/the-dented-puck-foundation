import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { Platform } from 'react-native';
import { auth, db, storage } from '@/firebase';
import { birthdayToIso, validateAccountStep, type AccountForm } from '@/components/auth/createAccountValidation';

export type AccountPhoto = { base64: string; mimeType: string } | null;

// Signs in or creates a Firebase Auth user. Does not write to Firestore.
export async function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    throw new Error('Google sign-in is currently available in the web app.');
  }

  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
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
