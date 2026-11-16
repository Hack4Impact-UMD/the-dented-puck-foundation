import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { EventWithId, Team, TeamWithId } from '@/types';

// Firestore stores times as Timestamps; the Event type uses Date.
function mapEvent(snapshot: DocumentSnapshot): EventWithId | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (!data) return null;
  return {
    ...data,
    id: snapshot.id,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
  } as EventWithId;
}

// get one event by document ID
export async function getEvent(eventId: string): Promise<EventWithId | null> {
  if (!eventId) return null;
  const snapshot = await getDoc(doc(db, 'Events', eventId));
  return mapEvent(snapshot);
}

// Events.teamIds is a list of numeric team ids (e.g. 201), not Teams document IDs.
// Firestore only allows 10 values per array-contains-any, so we query in chunks.
export async function getEventsForTeamIds(
  teamIds: (string | number)[],
): Promise<EventWithId[]> {
  const ids = [
    ...new Set(
      teamIds
        .map((id) => (typeof id === 'number' ? id : Number(id)))
        .filter((id) => Number.isFinite(id)),
    ),
  ];
  if (ids.length === 0) return [];

  const events: EventWithId[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const result = await getDocs(
      query(collection(db, 'Events'), where('teamIds', 'array-contains-any', chunk)),
    );
    for (const document of result.docs) {
      if (seen.has(document.id)) continue;
      const event = mapEvent(document);
      if (event) {
        seen.add(document.id);
        events.push(event);
      }
    }
  }

  return events;
}

// Events list teams by their `teamId` field (e.g. 201), which is not the Teams document ID (e.g. team_201).
export async function getTeamByTeamId(teamId: string | number): Promise<TeamWithId | null> {
  const result = await getDocs(query(collection(db, 'Teams'), where('teamId', '==', teamId), limit(1)));
  const found = result.docs[0];
  if (!found) return null;
  return { id: found.id, ...(found.data() as Team) };
}
