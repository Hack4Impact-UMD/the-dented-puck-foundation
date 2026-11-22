import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { auth, db, storage } from '@/firebase';

// Field names match what signup writes to the Users collection.
export type Profile = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string; // ISO string
  phoneNumber?: string; // digits only
  usaHockeyNumber?: string | null;
  allowLocation?: boolean;
  photoURL?: string;
  email?: string; // read from Firebase Auth
};

export async function getProfile(uid: string): Promise<Profile> {
  const snap = await getDoc(doc(db, 'Users', uid));
  const data = (snap.exists() ? snap.data() : {}) as Profile;
  return { ...data, email: auth.currentUser?.email ?? '' };
}

export async function updateProfile(uid: string, changes: Partial<Profile>) {
  await setDoc(doc(db, 'Users', uid), { ...changes, updatedAt: serverTimestamp() }, { merge: true });
}

// Same storage path signup uses, so a new photo replaces the old one.
export async function uploadProfilePhoto(uid: string, photo: { base64: string; mimeType: string }) {
  const photoRef = ref(storage, `profile-photos/${uid}/avatar`);
  await uploadString(photoRef, photo.base64, 'base64', { contentType: photo.mimeType });
  const url = await getDownloadURL(photoRef);
  // The download URL doesn't change when the file is replaced, so add a version
  // to the stored value or the app keeps showing the cached old image.
  await updateProfile(uid, { photoURL: `${url}&v=${Date.now()}` });
}
