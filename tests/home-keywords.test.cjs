const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./helpers/load-sandbox.cjs');
const { filterHomeSearch, searchHomeEvents } = createLoader()('src/utils/homeSearch.ts');

const coordinates = { latitude: 39.4143, longitude: -77.4105 };
const foxes = { id: 'foxes', name: 'Frederick Foxes', acronym: 'FF', city: 'Frederick, MD' };
const clinic = { id: 'clinic', title: 'All-abilities hockey clinic', location: 'Frederick Ice Center',
  teams: [foxes], startTime: new Date('2026-11-15T18:00:00Z'), endTime: new Date('2026-11-15T20:00:00Z'),
  isTeamSpecific: false, coordinates };
const catalog = { schedule: [], upcoming: [clinic], teams: [] };
const viewer = { uid: 'reader', teamIds: [], followedTeamIds: [] };

test('partial keywords match across fields in any order while connecting words do not restrict results', () => {
  for (const query of ['clini', 'fred clini', 'CLINI, FRÉD', 'clinic in frederick', 'clinic at frederick ice', 'clinic for the ff']) {
    assert.deepEqual(searchHomeEvents(catalog, query, 'all', viewer).map((event) => event.id), ['clinic'], query);
    assert.deepEqual(searchHomeEvents(catalog, query, 'schedule', viewer), [], 'matching never overrides the selected scope');
  }
  assert.deepEqual(searchHomeEvents(catalog, 'clinic baltimore', 'all', viewer), [], 'all meaningful keywords must match');
  const literal = { ...catalog, upcoming: [{ ...clinic, title: 'Hockey and pizza' }] };
  assert.equal(searchHomeEvents(literal, 'and', 'all', viewer).length, 1, 'connector-only searches retain literal matching');
  assert.deepEqual(filterHomeSearch(catalog, '.*['), { schedule: [], upcoming: [], teams: [] });
});

test('event cities remain searchable without a location or Nearby card, with catalog fallback for older adapters', () => {
  const event = { ...clinic, location: 'Community Rink', teams: [{ ...foxes, city: 'Ellicott City, MD' }] };
  const withoutNearby = { ...catalog, upcoming: [event] };
  assert.deepEqual(searchHomeEvents(withoutNearby, 'ellicott', 'all', viewer).map((row) => row.id), ['clinic']);
  assert.deepEqual(searchHomeEvents(withoutNearby, 'ellicott', 'nearby', viewer), [], 'Nearby still requires coordinates for the viewer');
  const older = { ...catalog, upcoming: [{ ...event, teams: [{ id: foxes.id, name: foxes.name }] }],
    teams: [{ ...foxes, ageRange: 'All ages', distanceKm: 0, coordinates }] };
  assert.equal(searchHomeEvents(older, 'frederick', 'all', viewer).length, 1);
});

test('straight and curly apostrophes do not require exact team or venue spelling', () => {
  const event = { ...clinic, title: 'Open practice', location: "John's Rink",
    teams: [{ id: 'club', name: 'Rocket’s Club', city: 'St. John’s', acronym: 'RC' }] };
  const records = { ...catalog, upcoming: [event] };
  for (const query of ['rockets', "rocket's", 'johns', 'practice at johns']) {
    assert.deepEqual(filterHomeSearch(records, query).upcoming.map((row) => row.id), ['clinic'], query);
  }
});
