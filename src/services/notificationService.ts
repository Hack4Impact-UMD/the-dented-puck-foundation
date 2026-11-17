import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { getEvent, getEventsForTeamIds, getTeamByTeamId } from '@/services/eventService';
import { EventWithId } from '@/types';

// A list item is an event. read is true once the user has opened it.
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

// TEMP: read ids are saved on this device only.
// TODO: replace with the users-to-read-notifications table when it exists.
function readKey(userId: string) {
  return `readNotifications:${userId}`;
}

async function getReadIds(userId: string): Promise<string[]> {
  const saved = await AsyncStorage.getItem(readKey(userId));
  return saved ? JSON.parse(saved) : [];
}

async function withTeamNames(
  events: EventWithId[],
  readIds: string[],
): Promise<EventNotification[]> {
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
    read: readIds.includes(event.id),
  }));
}

export async function getNotifications(): Promise<EventNotification[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const teamIds = await getUserTeamIds(userId);
  const events =
    teamIds.length > 0 ? await getEventsForTeamIds(teamIds) : await getEventsUserHasRsvp(userId);

  const now = Date.now();
  // Upcoming events are the notifications. Opened ones show in the Read tab.
  const upcoming = events
    .filter((event) => event.startTime.getTime() > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const readIds = await getReadIds(userId);
  return withTeamNames(upcoming, readIds);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const readIds = await getReadIds(userId);
  if (readIds.includes(notificationId)) return;
  await AsyncStorage.setItem(readKey(userId), JSON.stringify([...readIds, notificationId]));
}

export async function markNotificationUnread(notificationId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const readIds = await getReadIds(userId);
  await AsyncStorage.setItem(
    readKey(userId),
    JSON.stringify(readIds.filter((id) => id !== notificationId)),
  );
}
