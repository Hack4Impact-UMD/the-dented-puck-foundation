import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { getEvent, getEventsForTeamIds, getTeamByTeamId } from '@/services/eventService';
import { EventWithId } from '@/types';

// A list item is an event. read is always false until a later table tracks what the user has seen.
export type EventNotification = EventWithId & {
  teamName?: string;
  read: boolean;
};

// UserToTeam.teamId may be 201, "201", or "team_201". Events.teamIds uses numbers.
function parseTeamId(teamId: unknown): number | null {
  if (typeof teamId === 'number' && Number.isFinite(teamId)) return teamId;
  const text = String(teamId ?? '').trim();
  if (/^\d+$/.test(text)) return Number(text);
  const match = text.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function getUserTeamIds(userId: string): Promise<number[]> {
  const snap = await getDocs(
    query(
      collection(db, 'UserToTeam'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ),
  );

  const ids: number[] = [];
  for (const document of snap.docs) {
    const id = parseTeamId(document.data().teamId);
    if (id !== null && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

// Fallback when the user has no UserToTeam memberships.
async function getEventsUserHasRsvp(userId: string): Promise<EventWithId[]> {
  const snap = await getDocs(query(collectionGroup(db, 'RSVPs'), where('userId', '==', userId)));
  const eventIds = [
    ...new Set(
      snap.docs
        .map((document) => document.ref.parent.parent?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const events = await Promise.all(eventIds.map((id) => getEvent(id)));
  return events.filter((event): event is EventWithId => event !== null);
}

async function withTeamNames(events: EventWithId[]): Promise<EventNotification[]> {
  const teamIds = [
    ...new Set(events.map((event) => event.teamIds[0]).filter((id) => id !== undefined)),
  ];
  const names = new Map<string | number, string>();
  await Promise.all(
    teamIds.map(async (teamId) => {
      const team = await getTeamByTeamId(teamId);
      if (team) names.set(teamId, team.name);
    }),
  );

  return events.map((event) => ({
    ...event,
    teamName: event.teamIds[0] !== undefined ? names.get(event.teamIds[0]) : undefined,
    read: false,
  }));
}

export async function getNotifications(): Promise<EventNotification[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const teamIds = await getUserTeamIds(userId);
  const events =
    teamIds.length > 0 ? await getEventsForTeamIds(teamIds) : await getEventsUserHasRsvp(userId);

  const now = Date.now();
  // Upcoming events are Unread. The Read tab stays empty for now.
  // TODO: read state will come from a future users-to-read-notifications table.
  const upcoming = events
    .filter((event) => event.startTime.getTime() > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return withTeamNames(upcoming);
}

// TODO: persist read state once the users-to-read-notifications table exists.
export async function markNotificationRead(_notificationId: string): Promise<void> {
  return;
}
