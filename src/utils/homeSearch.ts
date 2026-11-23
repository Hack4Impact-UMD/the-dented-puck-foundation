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
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const CONNECTING_WORDS = new Set(['a', 'an', 'the', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'to', 'with']);

/** Match partial keywords across display fields in any order, never an exact
 * name or a regular expression. Ignore connecting words when keywords exist;
 * otherwise keep the literal query. Every remaining keyword must match. */
export function filterHomeSearch(catalog: HomeSearchCatalog, query: string): HomeSearchCatalog {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return { schedule: [], upcoming: [], teams: [] };
  const keywords = words.filter((word) => !CONNECTING_WORDS.has(word));
  const required = keywords.length ? keywords : words;
  const cities = new Map(catalog.teams.map((team) => [team.id, team.city]));
  const matches = (values: string[]) => {
    const text = normalize(values.join(' '));
    return required.every((word) => text.includes(word));
  };
  const matchesEvent = (event: HomeEvent) => matches([
    event.title, event.location,
    ...event.teams.flatMap((team) => [team.name, team.acronym ?? '']),
    // Event teams retain approved city metadata even without a location or
    // Nearby card. Catalog metadata also supports older display-only adapters.
    ...event.teams.flatMap((team) => [team.city ?? '', cities.get(team.id) ?? '']),
  ]);
  const matchesTeam = (team: NearbyTeam) => matches([team.name, team.acronym ?? '', team.city]);
  return {
    schedule: catalog.schedule.filter(matchesEvent),
    upcoming: catalog.upcoming.filter(matchesEvent),
    teams: catalog.teams.filter(matchesTeam),
  };
}
