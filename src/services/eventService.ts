import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { EventWithId, Team, TeamWithId } from '@/types';
import type { HomeEvent, HomeEventTeam } from '@/types/home';

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

// Same shape as Home's events, so See All can reuse Home's EventCard. regionId is for Sort > Nearest.
export type UpcomingEvent = HomeEvent & { regionId: number | null };

// get events from every region that haven't ended yet, soonest first, with their teams.
// One range filter on endTime needs no composite index; sorting by start time happens here.
export async function getUpcomingEvents(now = new Date()): Promise<UpcomingEvent[]> {
  const snapshot = await getDocs(query(collection(db, 'Events'), where('endTime', '>=', now)));

  const raw = snapshot.docs.flatMap((eventDoc) => {
    const data = eventDoc.data();
    const start = data.startTime?.toDate?.();
    const end = data.endTime?.toDate?.();
    if (!start || !end || typeof data.title !== 'string') return [];
    return [{ id: eventDoc.id, data, start, end }];
  });

  const teamNumbers = [...new Set(raw.flatMap(({ data }) => data.teamIds ?? []))];
  const teams = await getTeamsByTeamId(teamNumbers);

  return raw
    .map(({ id, data, start, end }) => {
      // The region field is spelled both ways in the data.
      const region = data.regionId ?? data.reigonId;
      return {
        id,
        title: data.title,
        startTime: start,
        endTime: end,
        location: typeof data.location === 'string' ? data.location : '',
        isTeamSpecific: data.isTeamSpecific === true,
        regionId: typeof region === 'number' ? region : null,
        teams: (data.teamIds ?? []).map((teamId: string | number) => teams.get(teamId)).filter(Boolean) as HomeEventTeam[],
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || a.title.localeCompare(b.title));
}

// Teams by their `teamId` field, 30 at a time (Firestore's limit for "in").
async function getTeamsByTeamId(teamIds: (string | number)[]) {
  const teams = new Map<string | number, HomeEventTeam>();
  for (let i = 0; i < teamIds.length; i += 30) {
    const result = await getDocs(query(collection(db, 'Teams'), where('teamId', 'in', teamIds.slice(i, i + 30))));
    for (const teamDoc of result.docs) {
      const data = teamDoc.data();
      if (typeof data.name !== 'string' || !data.name.trim()) continue;
      // EventCard builds the acronym from the name unless the team has its own `acronym`.
      const acronym = typeof data.acronym === 'string' && data.acronym.trim() ? data.acronym.trim() : undefined;
      teams.set(data.teamId, { id: teamDoc.id, name: data.name.trim(), ...(acronym ? { acronym } : {}) });
    }
  }
  return teams;
}

// post: coach/staff changes the note for players (6451). noteUpdatedAt marks the change so
// notifications can tell players the note changed.
export async function updateEventNote(eventId: string, notes: string) {
  await updateDoc(doc(db, 'Events', eventId), { notes, noteUpdatedAt: serverTimestamp() });
}
