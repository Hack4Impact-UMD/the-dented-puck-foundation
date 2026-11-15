import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { EventWithId, Team, TeamWithId } from '@/types';

// get one event by document ID
export async function getEvent(eventId: string): Promise<EventWithId | null> {
  if (!eventId) return null;
  const snapshot = await getDoc(doc(db, 'Events', eventId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  // Firestore stores times as Timestamps; the Event type uses Date.
  return {
    ...data,
    id: snapshot.id,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
  } as EventWithId;
}

// Events list teams by their `teamId` field (e.g. 201), which is not the Teams document ID (e.g. team_201).
export async function getTeamByTeamId(teamId: string | number): Promise<TeamWithId | null> {
  const result = await getDocs(query(collection(db, 'Teams'), where('teamId', '==', teamId), limit(1)));
  const found = result.docs[0];
  if (!found) return null;
  return { id: found.id, ...(found.data() as Team) };
}
