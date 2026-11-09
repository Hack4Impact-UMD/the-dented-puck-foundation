import type { HomeEvent, HomeSearchCatalog, HomeViewer, NearbyTeam } from '@/types/home';
import { isNearby } from '@/utils/homeLocation';

export type HomeSearchScope = 'all' | 'nearby' | 'schedule';

/** Search only the adapter's visible candidates. My schedule is membership in
 * joined/followed teams, not an inferred RSVP or event-registration record. */
export function searchHomeEvents(catalog: HomeSearchCatalog, query: string, scope: HomeSearchScope, viewer: HomeViewer): HomeEvent[] {
  const matches = query.trim() ? filterHomeSearch(catalog, query) : catalog;
  const candidates = scope === 'schedule' ? matches.schedule : [...matches.schedule, ...matches.upcoming];
  const unique = new Map<string, HomeEvent>();
  for (const event of candidates) {
    if (scope === 'nearby' && (!viewer.discoveryLocation || !isNearby(viewer.discoveryLocation, event.coordinates))) continue;
    if (!unique.has(event.id)) unique.set(event.id, event);
  }
  return [...unique.values()].sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Treat input as words, never as a regular expression. Every word must match,
 * in any order; accents, punctuation, and letter case are ignored. */
export function filterHomeSearch(catalog: HomeSearchCatalog, query: string): HomeSearchCatalog {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return { schedule: [], upcoming: [], teams: [] };
  const matches = (values: string[]) => {
    const text = normalize(values.join(' '));
    return words.every((word) => text.includes(word));
  };
  const matchesEvent = (event: HomeEvent) => matches([
    event.title, event.location,
    ...event.teams.flatMap((team) => [team.name, team.acronym ?? '']),
    // City is approved display metadata from the candidate set, not a guessed
    // Firestore field. Venue text is still searchable without this metadata.
    ...event.teams.flatMap((team) => catalog.teams.find((candidate) => candidate.id === team.id)?.city ?? []),
  ]);
  const matchesTeam = (team: NearbyTeam) => matches([team.name, team.acronym ?? '', team.city]);
  return {
    schedule: catalog.schedule.filter(matchesEvent),
    upcoming: catalog.upcoming.filter(matchesEvent),
    teams: catalog.teams.filter(matchesTeam),
  };
}
