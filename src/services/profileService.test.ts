import { auth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { SAMPLE_ACCOUNT } from '@/components/auth/__fixtures__/sampleAccount';
import { saveAccountProfile } from './profileService';

jest.mock('@/firebase', () => ({ auth: { currentUser: null }, db: {}, storage: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'profile-document'),
  serverTimestamp: jest.fn(() => 'server-time'),
  setDoc: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => 'photo-reference'),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('account profile persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(auth, { currentUser: { uid: 'test-user', email: 'verified@example.com' } });
    jest.mocked(setDoc).mockResolvedValue(undefined);
    jest.mocked(uploadString).mockResolvedValue({} as never);
    jest.mocked(getDownloadURL).mockResolvedValue('https://example.com/photo.jpg');
  });

  it('merges the profile under the authenticated UID and uses its trusted email', async () => {
    await saveAccountProfile({ ...SAMPLE_ACCOUNT, usaHockeyNumber: '' }, null);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'accountProfiles', 'test-user');
    expect(setDoc).toHaveBeenCalledWith('profile-document', expect.objectContaining({
      firstName: 'Alex', birthDate: '2002-06-14', email: 'verified@example.com',
      phoneNumber: '3015550142', usaHockeyNumber: null,
    }), { merge: true });
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('saves the selected photo URL with the profile after upload', async () => {
    await saveAccountProfile(SAMPLE_ACCOUNT, { base64: 'YWJj', mimeType: 'image/jpeg' });
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'profile-photos/test-user/avatar');
    expect(uploadString).toHaveBeenCalledWith('photo-reference', 'YWJj', 'base64', { contentType: 'image/jpeg' });
    expect(setDoc).toHaveBeenCalledWith('profile-document', expect.objectContaining({ photoURL: 'https://example.com/photo.jpg' }), { merge: true });
  });

  it('rejects unauthenticated or invalid submissions before any write', async () => {
    Object.assign(auth, { currentUser: null });
    await expect(saveAccountProfile(SAMPLE_ACCOUNT, null)).rejects.toThrow('Sign in before saving your account.');
    Object.assign(auth, { currentUser: { uid: 'test-user', email: 'verified@example.com' } });
    await expect(saveAccountProfile({ ...SAMPLE_ACCOUNT, birthday: '02/30/02' }, null)).rejects.toThrow('Enter a valid birthday (MM/DD/YY).');
    expect(setDoc).not.toHaveBeenCalled();
    expect(uploadString).not.toHaveBeenCalled();
  });

  it('does not mark the profile saved if the photo upload fails', async () => {
    jest.mocked(uploadString).mockRejectedValueOnce(new Error('Upload failed'));
    await expect(saveAccountProfile(SAMPLE_ACCOUNT, { base64: 'YWJj', mimeType: 'image/jpeg' })).rejects.toThrow('Upload failed');
    expect(setDoc).not.toHaveBeenCalled();
  });
});
