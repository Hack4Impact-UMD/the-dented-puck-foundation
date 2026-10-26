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

// PLACEHOLDER
// fallback when a team doc has no season
export function getSeasonLabel(date = new Date()): string {
    const startYear = date.getFullYear();
    return `${startYear}-${startYear + 1}`;
}
