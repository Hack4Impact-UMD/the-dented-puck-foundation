import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import type { RsvpResponse } from '@/components/events/RsvpSection';

// RSVPs live at Events/{eventId}/RSVP/{userId} as { userId, response }, where response is
// "yes", "no" or "maybe" (firestore.rules). The app's names for them are below.
const TO_STORED: Record<RsvpResponse, 'yes' | 'maybe' | 'no'> = { going: 'yes', maybe: 'maybe', 'cant-go': 'no' };
const FROM_STORED: Record<string, RsvpResponse> = { yes: 'going', maybe: 'maybe', no: 'cant-go' };

const rsvps = (eventId: string) => collection(db, 'Events', eventId, 'RSVP');

// get the signed-in player's reply. A query, not a get by ID: the rules deny reading a doc that doesn't exist.
export async function getMyRsvp(eventId: string): Promise<RsvpResponse | null> {
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const result = await getDocs(query(rsvps(eventId), where('userId', '==', uid)));
  return FROM_STORED[result.docs[0]?.data().response] ?? null;
}

// post: the signed-in player replies (or changes their reply)
export async function setMyRsvp(eventId: string, response: RsvpResponse) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to reply.');
  await setDoc(doc(rsvps(eventId), uid), { userId: uid, response: TO_STORED[response] });
}

export type ReplyGroups = Record<RsvpResponse, string[]>;

// "Jordan Park" -> "Jordan P." as in the design; falls back to the username.
function shortName(data: Record<string, unknown> | undefined) {
  const first = typeof data?.firstName === 'string' ? data.firstName.trim() : '';
  const last = typeof data?.lastName === 'string' ? data.lastName.trim() : '';
  if (first) return last ? `${first} ${last[0].toUpperCase()}.` : first;
  return typeof data?.username === 'string' && data.username.trim() ? data.username.trim() : 'Unknown player';
}

// get every reply to an event (staff only), grouped by status, names A to Z (6450, 6452)
export async function getEventReplies(eventId: string): Promise<ReplyGroups> {
  const result = await getDocs(rsvps(eventId));
  const groups: ReplyGroups = { going: [], maybe: [], 'cant-go': [] };

  await Promise.all(
    result.docs.map(async (rsvp) => {
      const { userId, response } = rsvp.data();
      const status = FROM_STORED[response];
      if (!status || typeof userId !== 'string') return;
      const user = await getDoc(doc(db, 'Users', userId));
      groups[status].push(shortName(user.data()));
    }),
  );

  for (const names of Object.values(groups)) names.sort((a, b) => a.localeCompare(b));
  return groups;
}
