import { getDocs } from 'firebase/firestore';
import { getTeamsInRegion } from './teamService';

jest.mock('@/firebase', () => ({ auth: {}, db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  where: jest.fn(),
}));

const teamDoc = (id: string, data: object) => ({ id, data: () => data });

describe('getTeamsInRegion', () => {
  it('merges both region spellings, skips inactive or unnamed teams, and puts the best record first', async () => {
    (getDocs as jest.Mock)
      // where('regionId', ...)
      .mockResolvedValueOnce({
        docs: [teamDoc('team_203', { name: 'Comets', status: 'active', wins: 7, losses: 1 })],
      })
      // where('reigonId', ...)
      .mockResolvedValueOnce({
        docs: [
          teamDoc('team_201', { name: 'Harbor Hawks', status: 'active', wins: 7, loses: 2, ageRange: ' All ages ' }),
          teamDoc('team_202', { name: 'Blades', status: 'active', wins: 3, loses: 0 }),
          teamDoc('team_204', { name: 'Old Team', status: 'inactive', wins: 20, loses: 0 }),
          teamDoc('team_205', { status: 'active', wins: 30, loses: 0 }),
        ],
      });

    const teams = await getTeamsInRegion(1);

    expect(teams.map((team) => team.id)).toEqual(['team_203', 'team_201', 'team_202']);
    expect(teams[1]).toEqual({ id: 'team_201', name: 'Harbor Hawks', ageRange: 'All ages', regionId: 1, wins: 7, losses: 2 });
    expect(teams[0].ageRange).toBeUndefined();
  });
});
