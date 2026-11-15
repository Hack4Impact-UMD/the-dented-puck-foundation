import { getDoc, getDocs } from 'firebase/firestore';
import { getEvent, getTeamByTeamId } from './eventService';

jest.mock('@/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'event-document'),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

describe('getEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the event with its id and Dates instead of Timestamps', async () => {
    const start = new Date(2026, 10, 7, 10, 0);
    const end = new Date(2026, 10, 7, 12, 0);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: 'event_301',
      data: () => ({
        title: 'Practice',
        location: 'Rink',
        teamIds: ['a'],
        startTime: { toDate: () => start },
        endTime: { toDate: () => end },
      }),
    });

    await expect(getEvent('event_301')).resolves.toMatchObject({
      id: 'event_301',
      title: 'Practice',
      startTime: start,
      endTime: end,
    });
  });

  it('returns null when the event does not exist', async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    await expect(getEvent('missing')).resolves.toBeNull();
  });

  it('returns null without reading when there is no id', async () => {
    await expect(getEvent('')).resolves.toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
});

describe('getTeamByTeamId', () => {
  it('finds the team by its teamId field and returns its document id', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: 'team_201', data: () => ({ name: 'Harbor Hawks', teamId: 201 }) }],
    });
    await expect(getTeamByTeamId(201)).resolves.toMatchObject({ id: 'team_201', name: 'Harbor Hawks' });
  });

  it('returns null when no team has that teamId', async () => {
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
    await expect(getTeamByTeamId(999)).resolves.toBeNull();
  });
});
