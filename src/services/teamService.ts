import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { Team, TeamWithId, UserToTeam, UserToTeamWithId } from '@/types';

// get one team by document ID
export async function getTeam(teamId: string): Promise<TeamWithId | null> {
    if (!teamId) return null;
    const snapshot = await getDoc(doc(db, 'Teams', teamId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...(snapshot.data() as Team) };
}

// PLACEHOLDER for a team's season information
export function getSeasonLabel(date = new Date()): string {
    const startYear = date.getFullYear();
    return `${startYear}-${startYear + 1}`;
}

function currentUserId() {
  if (!auth.currentUser) throw new Error('You need to be signed in.');
  return auth.currentUser.uid;
}

// A query rather than a get by ID: the rules let players read their own memberships,
// and a get on a doc that doesn't exist yet is denied instead of returning nothing.
export async function getJoinRequest(teamId: string): Promise<UserToTeamWithId | null> {
  const snap = await getDocs(
    query(
      collection(db, 'UserToTeam'),
      where('userId', '==', currentUserId()),
      where('teamId', '==', teamId),
      limit(1),
    ),
  );
  const found = snap.docs[0];
  return found ? { id: found.id, ...(found.data() as UserToTeam) } : null;
}

// A join request is a UserToTeam doc left "inactive" until the coach approves it.
// The doc ID is `${userId}_${teamId}` because that is how the rules look up memberships.
export async function requestToJoinTeam(teamId: string): Promise<UserToTeamWithId> {
  const existing = await getJoinRequest(teamId);
  if (existing) return existing;

  const userId = currentUserId();
  const request: UserToTeam = { userId, teamId, status: 'inactive' };
  const ref = doc(db, 'UserToTeam', `${userId}_${teamId}`);
  await setDoc(ref, request);
  return { id: ref.id, ...request };
}
