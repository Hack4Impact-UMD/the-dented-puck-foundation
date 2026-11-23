import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

export type Viewer = {
  uid: string;
  hasProfile: boolean;
  role: string | null;
  regionId: number | null;
  followedTeamIds: string[];
};

// get the signed-in user's region and followed teams from Users/{uid}
export async function getViewer(): Promise<Viewer | null> {
  // On web the signed-in user is restored after the page loads.
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, 'Users', uid));
  const data = snapshot.data() ?? {};
  const region = data.regionId ?? data.reigonId;
  return {
    uid,
    hasProfile: snapshot.exists(),
    role: typeof data.role === 'string' ? data.role : null,
    regionId: typeof region === 'number' ? region : null,
    followedTeamIds: Array.isArray(data.followedTeamIds) ? data.followedTeamIds : [],
  };
}

// Same roles as isTeamStaff() in firestore.rules, plus global admins (who can do everything).
export function isStaff(viewer: Viewer | null | undefined) {
  return ['team-staff', 'super-admin', 'global-admin'].includes(viewer?.role ?? '');
}

// post: follow or unfollow a team on the user's own profile
export async function setTeamFollowed(uid: string, teamId: string, followed: boolean) {
  await updateDoc(doc(db, 'Users', uid), {
    followedTeamIds: followed ? arrayUnion(teamId) : arrayRemove(teamId),
  });
}
