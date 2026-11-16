import type { UpcomingEvent } from '@/services/eventService';
import { filterByTeams, filterValue, listTeamNames, sortEvents, teamsInEvents } from './eventList';

jest.mock('@/firebase', () => ({ auth: {}, db: {} }));

const HAWKS = { id: 'team_201', name: 'Harbor Hawks', acronym: 'HH' };
const COMETS = { id: 'team_202', name: 'Chesapeake Comets', acronym: 'CC' };

const event = (id: string, day: number, regionId: number | null, teams = [HAWKS]): UpcomingEvent => ({
  id,
  title: id,
  startTime: new Date(2026, 11, day, 10),
  endTime: new Date(2026, 11, day, 12),
  location: 'Rink, City, MD',
  regionId,
  teams,
});

describe('event list helpers', () => {
  it('lists each team once, A to Z, for the Filter options', () => {
    const events = [event('a', 1, 1, [HAWKS, COMETS]), event('b', 2, 1, [HAWKS])];
    expect(teamsInEvents(events).map((team) => team.name)).toEqual(['Chesapeake Comets', 'Harbor Hawks']);
  });

  it('filters to events with any selected team, and shows all with no selection', () => {
    const events = [event('a', 1, 1, [HAWKS]), event('b', 2, 1, [COMETS])];
    expect(filterByTeams(events, ['team_202']).map((e) => e.id)).toEqual(['b']);
    expect(filterByTeams(events, [])).toHaveLength(2);
  });

  it('sorts by date by default, and by region distance (then date) for Nearest', () => {
    // Region 1 is Washington, 3 is Baltimore, 2 is New York; 99 is not in the table.
    const events = [event('ny', 1, 2), event('dc-late', 9, 1), event('unknown', 2, 99), event('dc-early', 3, 1), event('balt', 4, 3)];
    expect(sortEvents(events, 'date', 1).map((e) => e.id)).toEqual(['ny', 'unknown', 'dc-early', 'balt', 'dc-late']);
    expect(sortEvents(events, 'nearest', 1).map((e) => e.id)).toEqual(['dc-early', 'dc-late', 'balt', 'ny', 'unknown']);
    // No user region: Nearest falls back to date order.
    expect(sortEvents(events, 'nearest', null).map((e) => e.id)).toEqual(['ny', 'unknown', 'dc-early', 'balt', 'dc-late']);
  });

  it('describes the Filter value like the annotation', () => {
    expect(filterValue(0)).toBe('None');
    expect(filterValue(2)).toBe('2 applied');
  });

  it('joins team names for the spoken label', () => {
    expect(listTeamNames([HAWKS])).toBe('Harbor Hawks');
    expect(listTeamNames([HAWKS, COMETS])).toBe('Harbor Hawks and Chesapeake Comets');
    expect(listTeamNames([HAWKS, COMETS, { id: 'x', name: 'Prairie Thunder', acronym: 'PT' }])).toBe(
      'Harbor Hawks, Chesapeake Comets and Prairie Thunder',
    );
    expect(listTeamNames([])).toBe('');
  });
});
