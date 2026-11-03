import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { Invitation, InvitationWithId, UserToTeam } from '@/types';

const PENDING_INVITE_KEY = 'pendingInviteToken';

// the token passed in from the invite link is the same as the Invitations doc ID
// returns null if the invite is missing or already used
export async function getInvitation(token: string): Promise<InvitationWithId | null> {
  if (!token) return null;
  const snapshot = await getDoc(doc(db, 'Invitations', token));
  if (!snapshot.exists()) return null;
  const invitation = { id: snapshot.id, ...(snapshot.data() as Invitation) };
  return invitation.status === 'pending' ? invitation : null;
}

// keep the token saved across signup and email verification processes
export const savePendingInvite = (token: string) => AsyncStorage.setItem(PENDING_INVITE_KEY, token);
export const getPendingInvite = () => AsyncStorage.getItem(PENDING_INVITE_KEY);
export const clearPendingInvite = () => AsyncStorage.removeItem(PENDING_INVITE_KEY);

// add the signed-in user to the invited team, then marks the invite as used
// Same `${userId}_${teamId}` doc ID as requestToJoinTeam. Returns the teamId
export async function acceptInvitation(token: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('You need to be signed in.');

  const invitation = await getInvitation(token);
  if (!invitation) throw new Error('This invite is no longer valid.');

  const membership: UserToTeam = {
    userId: user.uid,
    teamId: invitation.teamId,
    status: 'active',
    invitationId: invitation.id,
  };
  await setDoc(doc(db, 'UserToTeam', `${user.uid}_${invitation.teamId}`), membership);
  await updateDoc(doc(db, 'Invitations', invitation.id), { status: 'active' });
  await clearPendingInvite();
  return invitation.teamId;
}
