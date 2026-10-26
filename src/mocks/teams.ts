import { TeamWithId } from '@/types';

// local stand-in for the Teams collection until Firestore rules allow reads
// IDs and names match Kasra's seed data (scripts/seed.json on Kasra/db-test-data)
export const mockTeams: Record<string, TeamWithId> = {
    team_201: { id: 'team_201', name: 'Harbor Hawks', region: 'Baltimore', supervisorId: 'user_1201', status: 'active', wins: 7, losses: 2, season: '2025-2026' },
    // no season, to exercise the getSeasonLabel() fallback
    team_202: { id: 'team_202', name: 'Chesapeake Comets', region: 'Baltimore', supervisorId: 'user_1203', status: 'active', wins: 5, losses: 4 },
};
