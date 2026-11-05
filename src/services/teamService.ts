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
import { Team, TeamWithId, UserToTeam, UserToTeamWithId } from "@/types";
import { locationRegionDistance, regionRegionDistance } from "./locationService";

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
export function createTeamSearch(teamList: TeamWithId[]) {
  return new Fuse<TeamWithId>(teamList, {
    keys: ["name"],
    threshold: 0.3,
    ignoreLocation: true,
  });
}

// search a parameter list of Teams using a parameter Fuse
export function searchProducts(
  fuse: Fuse<TeamWithId>,
  query: string,
): TeamWithId[] {
  return fuse.search(query).map((result) => result.item);
}

//sort a list of teams by proximity to region with given region id
export function sortTeamsByProxToRegion(teamList: Team[], regionId: number) {
  teamList.sort((team1, team2) => {
    return regionRegionDistance(Number(team1.region), regionId) -
      regionRegionDistance(Number(team2.region), regionId);
  });
}

//sort a list of teams by proximity to a point with latitude and longitude coordinates
export function sortTeamsByProxToCoords(teamList: Team[], lat: number, lon: number) {
  teamList.sort((team1, team2) => {
    return locationRegionDistance(Number(team1.region), lat, lon) -
      locationRegionDistance(Number(team2.region), lat, lon);
  });
}
