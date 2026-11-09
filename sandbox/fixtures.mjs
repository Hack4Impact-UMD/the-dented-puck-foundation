// Deliberately fake, emulator-only data. No production schema is implied.
export const teams = {
  blades: { id: 'sandbox-blades', name: 'Baltimore Blades', acronym: 'BB', city: 'Baltimore, MD', ageRange: 'All ages', coordinates: { latitude: 39.2904, longitude: -76.6122 } },
  crew: { id: 'sandbox-crew', name: 'Dented Crew', acronym: 'DC', city: 'Baltimore, MD', ageRange: 'All ages', coordinates: { latitude: 39.3, longitude: -76.6 } },
  rockets: { id: 'sandbox-rockets', name: 'River City Rockets', acronym: 'RCR', city: 'Ellicott City, MD', ageRange: 'All ages', coordinates: { latitude: 39.2673, longitude: -76.7983 } },
  ice: { id: 'sandbox-ice', name: 'Capital Ice', acronym: 'CI', city: 'Washington, DC', ageRange: 'All ages', coordinates: { latitude: 38.9072, longitude: -77.0369 } },
  foxes: { id: 'sandbox-foxes', name: 'Frederick Foxes', acronym: 'FF', city: 'Frederick, MD', ageRange: 'All ages', coordinates: { latitude: 39.4143, longitude: -77.4105 } },
};

export const demoLocations = [
  { label: 'Baltimore, MD', latitude: 39.2904, longitude: -76.6122 },
  { label: 'Washington, DC', latitude: 38.9072, longitude: -77.0369 },
  { label: 'Frederick, MD', latitude: 39.4143, longitude: -77.4105 },
  { label: 'Richmond, VA', latitude: 37.5407, longitude: -77.436 },
];

export function createSandboxFixtures(settings, now = new Date()) {
  const viewer = {
    name: settings.name, region: settings.region,
    teamIds: [teams.blades.id], followedTeamIds: [teams.crew.id], unreadCount: 3,
    discoveryLocation: { ...demoLocations[0], source: 'demo' },
  };
  const events = [];
  function event(id, title, day, eventTeams, options = {}) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + day);
    startTime.setHours(18, 0, 0, 0);
    const value = {
      id, title, startTime, endTime: new Date(startTime.getTime() + 90 * 60_000),
      location: 'Baltimore Ice Center', region: settings.region,
      isPublic: true, isTeamSpecific: false, teams: eventTeams, ...options,
      coordinates: eventTeams[0]?.coordinates ?? teams.blades.coordinates,
    };
    events.push(value);
  }
  const scheduleTitles = [
    'Team practice', 'Puck & Pizza', 'Blades vs. Rockets', 'Skills and skating',
    'Community skate', 'Game night', 'Weekend scrimmage', 'Team celebration',
  ];
  scheduleTitles.forEach((title, i) => {
    const eventTeams = i === 2 ? [teams.blades, teams.rockets] : [i % 2 ? teams.crew : teams.blades];
    event(`schedule-${String(i + 1).padStart(2, '0')}`, title, i + 1, eventTeams, {
      isTeamSpecific: i % 2 === 0, isPublic: i % 2 !== 0 || i === 2,
      location: i % 2 ? 'Dented Puck Community Rink' : 'Baltimore Ice Center',
    });
  });
  const discoveryTitles = [
    'Try hockey day', 'Open ice social', 'Family skate', 'Rockets community game',
    'Learn to skate', 'All-abilities hockey clinic', 'Charity skate', 'Sunday skills session',
    'Hockey and hot chocolate', 'Meet the teams', 'Beginner stick and puck', 'Winter community cup',
    'Goalie workshop', 'Adaptive hockey showcase', 'Friends on ice', 'Weekend open skate',
    'Community scrimmage', 'Skating fundamentals', 'Youth hockey open house', 'Pucks for a purpose',
    'Evening ice social', 'Inclusive hockey night', 'Holiday skate preview', 'Rinkside meet-up',
    'Regional friendly game', 'Season kickoff skate',
  ];
  const outsideTeams = [teams.rockets, teams.ice, teams.foxes];
  discoveryTitles.forEach((title, i) => event(
    `discover-${String(i + 1).padStart(2, '0')}`, title, i + 1,
    i === 3 ? [teams.rockets, teams.ice] : [outsideTeams[i % outsideTeams.length]],
    { location: ['River City Ice Arena', 'Capital Community Rink', 'Frederick Ice Center'][i % 3] },
  ));
  // Deliberately excluded controls for the sandbox visibility tests.
  event('past-practice', 'Past practice (hidden)', -1, [teams.blades]);
  event('other-region', 'Out-of-region event (hidden)', 1, [teams.ice], { region: 'sandbox-west' });
  event('private-away', 'Private away practice (hidden)', 1, [teams.ice], { isPublic: false, isTeamSpecific: true });
  event('unknown-team', 'Missing team metadata (hidden)', 1, []);

  const affiliated = new Set([...viewer.teamIds, ...viewer.followedTeamIds]);
  const schedule = events.filter((item) => item.teams.some((team) => affiliated.has(team.id)));
  const upcoming = events.filter((item) => item.region === viewer.region && item.isPublic && !item.isTeamSpecific &&
    item.teams.length > 0 && item.teams.every((team) => !affiliated.has(team.id)));
  return { viewer, events, schedule, upcoming };
}
