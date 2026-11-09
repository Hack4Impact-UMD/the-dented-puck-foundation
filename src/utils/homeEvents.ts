import type { HomeEvent, HomeEventTeam, HomeSection, HomeViewer } from '@/types/home';
import { isNearby } from '@/utils/homeLocation';

export function teamAcronym(team: HomeEventTeam): string {
  const acronym = typeof team.acronym === 'string' ? team.acronym.trim() : '';
  return acronym || team.name.trim().split(/\s+/).map((word) => Array.from(word)[0]).join('').toLocaleUpperCase();
}

export function teamRelationship(teamId: string, viewer?: HomeViewer | null): 'Joined' | 'Followed' | undefined {
  if (viewer?.teamIds.includes(teamId)) return 'Joined';
  if (viewer?.followedTeamIds.includes(teamId)) return 'Followed';
  return undefined;
}

/** Visibility must also be enforced by backend queries. Unknown team metadata
 * cannot establish that an event belongs in either feed, so it is excluded.
 */
export function eventBelongsInSection(event: HomeEvent, viewer: HomeViewer, section: HomeSection): boolean {
  if (!Array.isArray(event.teams) || !event.teams.length || event.teams.some((team) =>
    !team || typeof team.id !== 'string' || !team.id.trim() || typeof team.name !== 'string' || !team.name.trim())) return false;
  const affiliated = event.teams.some((team) => teamRelationship(team.id, viewer));
  return section === 'schedule' ? affiliated : !affiliated &&
    (!viewer.discoveryLocation || isNearby(viewer.discoveryLocation, event.coordinates));
}
