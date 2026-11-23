import { getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getEventReplies, getMyRsvp, setMyRsvp } from './rsvpService';

jest.mock('@/firebase', () => ({ auth: { currentUser: { uid: 'me' }, authStateReady: jest.fn() }, db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'rsvps'),
  doc: jest.fn((_parent, ...path) => path.join('/')),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  where: jest.fn(),
}));

describe('rsvpService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads my reply and maps "yes" / "no" / "maybe" to the app names', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [{ data: () => ({ userId: 'me', response: 'no' }) }] });
    await expect(getMyRsvp('event_301')).resolves.toBe('cant-go');
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    await expect(getMyRsvp('event_301')).resolves.toBeNull();
  });

  it('saves my reply under my user ID in the shape the rules allow', async () => {
    await setMyRsvp('event_301', 'going');
    expect(setDoc).toHaveBeenCalledWith('me', { userId: 'me', response: 'yes' });
  });

  it('groups replies by status with short names, A to Z', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        { data: () => ({ userId: 'u1', response: 'yes' }) },
        { data: () => ({ userId: 'u2', response: 'maybe' }) },
        { data: () => ({ userId: 'u3', response: 'yes' }) },
        { data: () => ({ userId: 'u4', response: 'no' }) },
        { data: () => ({ userId: 'u5', response: 'unknown' }) },
      ],
    });
    const users: Record<string, object> = {
      'Users/u1': { firstName: 'Sam', lastName: 'Kim' },
      'Users/u2': { firstName: 'Morgan', lastName: 'Smith' },
      'Users/u3': { firstName: 'Jordan', lastName: 'park' },
      'Users/u4': { username: 'reese.t' },
    };
    (getDoc as jest.Mock).mockImplementation(async (path: string) => ({ data: () => users[path] }));

    await expect(getEventReplies('event_301')).resolves.toEqual({
      going: ['Jordan P.', 'Sam K.'],
      maybe: ['Morgan S.'],
      'cant-go': ['reese.t'],
    });
  });
});
