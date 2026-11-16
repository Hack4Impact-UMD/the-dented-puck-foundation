import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import Fuse from "fuse.js";
import { auth, db } from "@/firebase";
import { Team, TeamWithId, UserToTeam, UserToTeamWithId , Region } from "@/types";


import { getDistance } from "geolib";

// array of region objects representing a hardcoded mapping of region id's (array indices) onto
// region objects
export const regions: Region[] = [
  {
    regionId: 1,
    city: "Washington",
    state: "DC",
    country: "United States of America",
    lat: 38.907192,
    lon: -77.036873,
  },
  {
    regionId: 2,
    city: "New York",
    state: "NY",
    country: "United States of America",
    lat: 40.712776,
    lon: -74.005974,
  },
  {
    regionId: 3,
    city: "Baltimore",
    state: "MD",
    country: "United States of America",
    lat: 39.290386,
    lon: -76.61219,
  },
  {
    regionId: 4,
    city: "Los Angeles",
    state: "CA",
    country: "United States of America",
    lat: 34.052235,
    lon: -118.243683,
  },
];

// helper function to get the distance between two regions
// (when given two region id's) ronuded to the nearest mile
export function regionRegionDistance(regionId1: number, regionId2: number) {
  return Math.round(getDistance(
    {
      latitude: regions[regionId1 - 1].lat,
      longitude: regions[regionId1 - 1].lon,
    },
    {
      latitude: regions[regionId2 - 1].lat,
      longitude: regions[regionId2 - 1].lon,
    },
  ) / 1609.344);
}

// helper function to get the distance between a region and a location
// (when given a region id and latitude/longitude coordinates) rounded to the nearest mile
export function locationRegionDistance(regionId: number, lat: number, lon: number) {
  return Math.round(getDistance(
    {
      latitude: regions[regionId - 1].lat,
      longitude: regions[regionId - 1].lon,
    },
    {
      latitude: lat,
      longitude: lon,
    },
  ) / 1609.344);
}


export type SearchOrigin =
  | { type: "coordinates"; latitude: number; longitude: number }
  | { type: "region"; regionId: number };

export type TeamWithDistance = {
  team: TeamWithId;
  distanceMiles: number;
};

// get one team by document ID
export async function getTeam(teamId: string): Promise<TeamWithId | null> {
  if (!teamId) return null;
  const snapshot = await getDoc(doc(db, "Teams", teamId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Team) };
}

// PLACEHOLDER for a team's season information
export function getSeasonLabel(date = new Date()): string {
  const startYear = date.getFullYear();
  return `${startYear}-${startYear + 1}`;
}

function currentUserId() {
  if (!auth.currentUser) throw new Error("You need to be signed in.");
  return auth.currentUser.uid;
}

// A query rather than a get by ID: the rules let players read their own memberships,
// and a get on a doc that doesn't exist yet is denied instead of returning nothing.
export async function getJoinRequest(
  teamId: string,
): Promise<UserToTeamWithId | null> {
  const snap = await getDocs(
    query(
      collection(db, "UserToTeam"),
      where("userId", "==", currentUserId()),
      where("teamId", "==", teamId),
      limit(1),
    ),
  );
  const found = snap.docs[0];
  return found ? { id: found.id, ...(found.data() as UserToTeam) } : null;
}

// A join request is a UserToTeam doc left "inactive" until the coach approves it.
// The doc ID is `${userId}_${teamId}` because that is how the rules look up memberships.
export async function requestToJoinTeam(
  teamId: string,
): Promise<UserToTeamWithId> {
  const existing = await getJoinRequest(teamId);
  if (existing) return existing;

  const userId = currentUserId();
  const request: UserToTeam = { userId, teamId, status: "inactive" };
  const ref = doc(db, "UserToTeam", `${userId}_${teamId}`);
  await setDoc(ref, request);
  return { id: ref.id, ...request };
}

// Fetch a list of all teams in firestore
export async function fetchAllTeams(): Promise<TeamWithId[]> {
  const startedAt = Date.now();
  console.info("[teamService] Fetching teams from Firestore.");

  try {
    const snapshot = await getDocs(collection(db, "Teams"));
    console.info(
      `[teamService] Firestore returned ${snapshot.size} team documents in ${Date.now() - startedAt}ms.`,
    );
    const teams = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: data.teamId,
        // manually map firestore fields onto Team object fields
        // because they may have different names for the same field
        region: data.reigonId,
        name: data.name,
        supervisorId: data.supervisor.userId,
        status: data.status,
        wins: data.wins,
        losses: data.loses,
      };
    });

    console.info(`[teamService] Mapped ${teams.length} teams from Firestore.`);
    return teams;
  } catch (error) {
    console.error(
      `[teamService] Failed to fetch or map teams after ${Date.now() - startedAt}ms.`,
      error,
    );
    throw error;
  }
}

// creates a Fuse to search a teamlist
// searches by team name and it's region's city name if the city property exists
export function createTeamSearch(teamList: TeamWithId[]) {
  return new Fuse<TeamWithId>(teamList, {
    keys: ["name", {name: "city", getFn: (team) => regions[Number(team.region) - 1]?.city ?? ""}],
    threshold: 0.3,
    ignoreLocation: true,
  });
}

// search a parameter list of Teams using a parameter Fuse
export function searchTeams(
  fuse: Fuse<TeamWithId>,
  query: string,
): TeamWithId[] {
  return fuse.search(query).map((result) => result.item);
}

export function sortTeamsByProximity(
  teamList: TeamWithId[],
  origin: SearchOrigin,
): TeamWithDistance[] {
  return teamList
    .map((team) => ({
      team,
      distanceMiles:
        origin.type === "coordinates"
          ? locationRegionDistance(
              Number(team.region),
              origin.latitude,
              origin.longitude,
            )
          : regionRegionDistance(Number(team.region), origin.regionId),
    }))
    .sort((team1, team2) => team1.distanceMiles - team2.distanceMiles);
}

export type RegionTeam = {
  id: string; // Firestore document ID, e.g. "team_201", used by the Team detail route
  name: string;
  ageRange?: string; // display text, e.g. "Ages 12 to 40" or "All ages"; same field Home reads
  regionId: number;
  wins: number;
  losses: number;
};

// get active teams in one region, best record first (most wins, then fewest losses).
// Every team in a region is the same distance away (teams only store a region), so
// "closest first" can't separate them yet; record is the tiebreak until teams have coordinates.
export async function getTeamsInRegion(regionId: number): Promise<RegionTeam[]> {
  // The region field is spelled both ways in the data.
  const snapshots = await Promise.all(
    ["regionId", "reigonId"].map((field) =>
      getDocs(query(collection(db, "Teams"), where(field, "==", regionId))),
    ),
  );

  const teams = new Map<string, RegionTeam>();
  for (const snapshot of snapshots) {
    for (const teamDoc of snapshot.docs) {
      const data = teamDoc.data();
      // Skip inactive teams and records without a name (the card shows the name and its initials).
      if (data.status !== "active" || typeof data.name !== "string" || !data.name.trim()) continue;
      teams.set(teamDoc.id, {
        id: teamDoc.id,
        name: data.name.trim(),
        ageRange: typeof data.ageRange === "string" && data.ageRange.trim() ? data.ageRange.trim() : undefined,
        regionId,
        wins: data.wins ?? 0,
        losses: data.losses ?? data.loses ?? 0,
      });
    }
  }

  return [...teams.values()].sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name),
  );
}
