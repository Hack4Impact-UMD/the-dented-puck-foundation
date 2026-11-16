import { regionRegionDistance, regions } from '@/services/teamService';
import type { EventTeam, UpcomingEvent } from '@/services/eventService';

export type EventSort = 'date' | 'nearest';

export const SORT_LABELS: Record<EventSort, string> = { date: 'By date', nearest: 'Nearest' };

// Every team that appears in the list, for the Filter options, A to Z.
export function teamsInEvents(events: UpcomingEvent[]): EventTeam[] {
  const teams = new Map<string, EventTeam>();
  for (const event of events) for (const team of event.teams) teams.set(team.id, team);
  return [...teams.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Keep events that include any selected team. No selection shows everything.
export function filterByTeams(events: UpcomingEvent[], teamIds: string[]) {
  if (!teamIds.length) return events;
  return events.filter((event) => event.teams.some((team) => teamIds.includes(team.id)));
}

// Events only store a region, so "nearest" is distance between the event's region and the user's.
// Events in the same region tie, and ties stay soonest first. Without a user region, Nearest is by date.
export function sortEvents(events: UpcomingEvent[], sort: EventSort, viewerRegionId: number | null) {
  // regionRegionDistance throws for a region missing from the table, so those go last.
  const known = (id: number | null): id is number => regions.some((region) => region.regionId === id);
  const distance = (event: UpcomingEvent) =>
    known(event.regionId) && known(viewerRegionId) ? regionRegionDistance(event.regionId, viewerRegionId) : Infinity;
  const byDate = (a: UpcomingEvent, b: UpcomingEvent) => a.startTime.getTime() - b.startTime.getTime();
  if (sort === 'date') return [...events].sort(byDate);
  return [...events].sort(
    (a, b) =>
      (distance(a) === distance(b) ? 0 : distance(a) - distance(b)) || byDate(a, b),
  );
}

// Filter button value from the annotation: "None", or "2 applied".
export function filterValue(count: number) {
  return count ? `${count} applied` : 'None';
}

// "Harbor Hawks", "Harbor Hawks and Chesapeake Comets", "A, B and C" for the card's spoken label.
export function listTeamNames(teams: EventTeam[]) {
  const names = teams.map((team) => team.name);
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
