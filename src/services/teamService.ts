import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Team, TeamWithId } from '@/types';
import { mockTeams } from '@/mocks/teams';

// set EXPO_PUBLIC_USE_MOCK_DATA=true in .env.local to utilize mock data instead of Firestore
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

// get one team by document ID
export async function getTeam(teamId: string): Promise<TeamWithId | null> {
    if (!teamId) return null
    if (USE_MOCKS) return mockTeams[teamId] ?? null
    const snapshot = await getDoc(doc(db, 'Teams', teamId));
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...(snapshot.data() as Team) }
}

// PLACEHOLDER
// fallback when a team doc has no season
export function getSeasonLabel(date = new Date()): string {
    const startYear = date.getFullYear();
    return `${startYear}-${startYear + 1}`;
}
