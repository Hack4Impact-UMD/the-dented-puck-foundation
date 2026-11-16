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
import { Region, Status, Team, TeamWithId, UserToTeam, UserToTeamWithId } from "@/types";


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

// helper function to get region by id (number or string) or by city/state name
export function getRegion(value: unknown): Region | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return regions.find((r) => r.regionId === num) ?? regions[num - 1];
  }
  if (typeof value === "string" && value.trim()) {
    const text = value.trim().toLowerCase();
    return regions.find(
      (r) =>
        r.city.toLowerCase() === text ||
        r.state?.toLowerCase() === text ||
        r.country.toLowerCase() === text,
    );
  }
  return undefined;
}

// helper function to get the distance between two regions
// (when given two region id's) rounded to the nearest mile
export function regionRegionDistance(regionId1: unknown, regionId2: unknown): number {
  const r1 = getRegion(regionId1);
  const r2 = getRegion(regionId2);

  if (!r1 || !r2) {
    return 0;
  }

  return Math.round(
    getDistance(
      {
        latitude: r1.lat,
        longitude: r1.lon,
      },
      {
        latitude: r2.lat,
        longitude: r2.lon,
      },
    ) / 1609.344,
  );
}

// helper function to get the distance between a region and a location
// (when given a region id and latitude/longitude coordinates) rounded to the nearest mile
export function locationRegionDistance(
  regionId: unknown,
  lat: number,
  lon: number,
): number {
  const r = getRegion(regionId);

  if (!r || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return 0;
  }

  return Math.round(
    getDistance(
      {
        latitude: r.lat,
        longitude: r.lon,
      },
      {
        latitude: lat,
        longitude: lon,
      },
    ) / 1609.344,
  );
}


export type SearchOrigin =
  | { type: "coordinates"; latitude: number; longitude: number }
  | { type: "region"; regionId: number };

export type TeamWithDistance = {
  team: TeamWithId;
  distanceMiles: number;
};

// get one team by document ID or teamId field
export async function getTeam(teamId: string): Promise<TeamWithId | null> {
  if (!teamId) return null;

  const mapTeamData = (id: string, data: Record<string, any>): TeamWithId => ({
    id,
    region: data.reigonId ? String(data.reigonId) : (data.regionId ? String(data.regionId) : String(data.region ?? "")),
    name: data.name ?? "",
    supervisorId: (typeof data.supervisorId === "string" ? data.supervisorId : data.supervisor?.userId) ?? "",
    status: data.status ?? "active",
    wins: data.wins ?? 0,
    losses: data.losses ?? data.loses ?? 0,
  });

  // 1. Direct doc lookup by document ID
  const snapshot = await getDoc(doc(db, "Teams", teamId));
  if (snapshot.exists()) {
    return mapTeamData(snapshot.id, snapshot.data());
  }

  // 2. Fallback: try prefix "team_" if not already present
  if (!teamId.startsWith("team_")) {
    const prefixedSnap = await getDoc(doc(db, "Teams", `team_${teamId}`));
    if (prefixedSnap.exists()) {
      return mapTeamData(prefixedSnap.id, prefixedSnap.data());
    }
  }

  // 3. Fallback: query by teamId field (as number or string)
  const numTeamId = Number(teamId);
  const q = Number.isNaN(numTeamId)
    ? query(collection(db, "Teams"), where("teamId", "==", teamId), limit(1))
    : query(collection(db, "Teams"), where("teamId", "in", [teamId, numTeamId]), limit(1));

  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const foundDoc = querySnap.docs[0];
    return mapTeamData(foundDoc.id, foundDoc.data());
  }

  return null;
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

// Creates a new team in Firestore.
// Populates supervisorId on the team document (does NOT add userId to Teams).
// Also populates the UserToTeam collection with { userId, teamId, status: "active" }.
export async function createTeam(
  teamData: Partial<Team> & Pick<Team, "name" | "region">,
  userId?: string,
): Promise<TeamWithId> {
  const creatorUserId = userId || currentUserId();
  const supervisorId = teamData.supervisorId || creatorUserId;

  const teamDocRef = doc(collection(db, "Teams"));
  const teamId = teamDocRef.id;

  const newTeam: Team = {
    ...teamData,
    name: teamData.name.trim(),
    region: String(teamData.region),
    supervisorId,
    status: teamData.status ?? "active",
    wins: teamData.wins ?? 0,
    losses: teamData.losses ?? 0,
  };

  await setDoc(teamDocRef, {
    ...newTeam,
    teamId,
    regionId: Number(teamData.region) || 1,
    reigonId: Number(teamData.region) || 1,
  });

  // Populate UserToTeam collection: { userId, teamId, status }
  const userToTeamRef = doc(db, "UserToTeam", `${creatorUserId}_${teamId}`);
  const userToTeam: UserToTeam = {
    userId: creatorUserId,
    teamId,
    status: "active",
  };
  await setDoc(userToTeamRef, userToTeam);

  return {
    id: teamId,
    ...newTeam,
  };
}

// Add or update a user's membership in the UserToTeam collection
export async function addUserToTeam(
  userId: string,
  teamId: string,
  status: Status = "active",
): Promise<UserToTeamWithId> {
  const userToTeamRef = doc(db, "UserToTeam", `${userId}_${teamId}`);
  const entry: UserToTeam = {
    userId,
    teamId,
    status,
  };
  await setDoc(userToTeamRef, entry);
  return { id: userToTeamRef.id, ...entry };
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
        id: doc.id,
        // manually map firestore fields onto Team object fields
        // because they may have different names for the same field
        region: data.reigonId ? String(data.reigonId) : (data.regionId ? String(data.regionId) : String(data.region ?? "")),
        name: data.name ?? "",
        supervisorId: (typeof data.supervisorId === "string" ? data.supervisorId : data.supervisor?.userId) ?? "",
        status: data.status ?? "active",
        wins: data.wins ?? 0,
        losses: data.losses ?? data.loses ?? 0,
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
    keys: ["name", {name: "city", getFn: (team) => getRegion(team.region)?.city ?? ""}],
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
              team.region,
              origin.latitude,
              origin.longitude,
            )
          : regionRegionDistance(team.region, origin.regionId),
    }))
    .sort((team1, team2) => team1.distanceMiles - team2.distanceMiles);
}
