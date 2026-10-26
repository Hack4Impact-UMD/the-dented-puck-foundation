import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Team, TeamWithId } from '@/types';

// get one team by document ID
export async function getTeam(teamId: string): Promise<TeamWithId | null> {
    if (!teamId) return null
    const snapshot = await getDoc(doc(db, 'Teams', teamId));
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...(snapshot.data() as Team) }
}

// PLACEHOLDER for a team's season information (hardcoded as 2026-2027)
export function getSeasonLabel(date = new Date()): string {
    const startYear = date.getFullYear();
    return `${startYear}-${startYear + 1}`;
}
