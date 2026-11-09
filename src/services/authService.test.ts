import { auth } from '@/firebase';
import { FirebaseError } from 'firebase/app';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { SAMPLE_ACCOUNT } from '@/components/auth/__fixtures__/sampleAccount';
import {
  getAuthFormError,
  getPostSignInRoute,
  getUserProfile,
  resendVerificationEmail,
  saveAccountProfile,
  sendPasswordReset,
  signInWithEmail,
} from './authService';

jest.mock('@/firebase', () => ({ auth: { currentUser: null }, db: {}, storage: {} }));
jest.mock('firebase/auth', () => ({
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'profile-document'),
  getDoc: jest.fn(),
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
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'Users', 'test-user');
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

describe('existing profile and verification APIs after merging onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('continues loading the verification profile from Users by Auth UID', async () => {
    const profile = {
      age: 24,
      email: 'verified@example.com',
      'phone-number': '3015550142',
      regionId: 1,
      role: 'player',
      userId: 42,
      username: 'Taylor',
    };
    jest.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => profile,
    } as never);

    await expect(getUserProfile('test-user')).resolves.toEqual(profile);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'Users', 'test-user');
  });

  it('can resend verification for an unverified account', async () => {
    const user = { email: 'verified@example.com', emailVerified: false } as NonNullable<typeof auth.currentUser>;
    jest.mocked(sendEmailVerification).mockResolvedValue(undefined);

    await resendVerificationEmail(user);

    expect(sendEmailVerification).toHaveBeenCalledWith(user);
  });

  it('rejects signed-out verification requests before sending an email', async () => {
    await expect(resendVerificationEmail(null)).rejects.toThrow('Sign in before requesting an email verification link.');
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});

describe('login and password reset', () => {
  const firebaseError = (code: string) => new FirebaseError(code, code);
  const user = (props: Partial<User>) => ({ uid: 'test-user', emailVerified: true, ...props }) as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs in with a trimmed email', async () => {
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: user({}) } as never);
    await expect(signInWithEmail('  sam@gmail.com ', 'hockey2026')).resolves.toEqual(expect.objectContaining({ uid: 'test-user' }));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'sam@gmail.com', 'hockey2026');
  });

  it('sends the reset email and never reveals whether the account exists', async () => {
    jest.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);
    await sendPasswordReset(' sam@gmail.com ');
    // The link opens our app when it's installed (Figma 5400)
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'sam@gmail.com', expect.objectContaining({
      handleCodeInApp: true,
      iOS: { bundleId: 'org.thedentedpuckfoundation.app' },
      android: expect.objectContaining({ packageName: 'org.thedentedpuckfoundation.app' }),
    }));

    jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce(firebaseError('auth/user-not-found'));
    await expect(sendPasswordReset('nobody@gmail.com')).resolves.toBeUndefined();

    jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce(firebaseError('auth/network-request-failed'));
    await expect(sendPasswordReset('sam@gmail.com')).rejects.toThrow('auth/network-request-failed');
  });

  it('routes signed-in users to verification, onboarding, or the app', async () => {
    await expect(getPostSignInRoute(user({ emailVerified: false }))).resolves.toBe('/auth/verify-email');
    expect(getDoc).not.toHaveBeenCalled();

    jest.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);
    await expect(getPostSignInRoute(user({}))).resolves.toBe('/auth/create-account');

    // A doc written at verification time, before onboarding, has no firstName yet
    jest.mocked(getDoc).mockResolvedValueOnce({ exists: () => true, data: () => ({ email: 'a@b.co', role: 'player' }) } as never);
    await expect(getPostSignInRoute(user({}))).resolves.toBe('/auth/create-account');

    jest.mocked(getDoc).mockResolvedValueOnce({ exists: () => true, data: () => ({ firstName: 'Sam' }) } as never);
    await expect(getPostSignInRoute(user({}))).resolves.toBe('/tabs/home');
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'Users', 'test-user');
  });

  it('shows one credentials alert for a wrong password or an unknown email', () => {
    for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']) {
      expect(getAuthFormError(firebaseError(code))).toEqual({ field: 'credentials', code, message: 'Email or password is incorrect.' });
    }
  });

  it('treats expired and already-used reset links the same way', () => {
    for (const code of ['auth/expired-action-code', 'auth/invalid-action-code']) {
      expect(getAuthFormError(firebaseError(code))).toEqual({ field: 'link', code, message: 'This link has expired or was already used.' });
    }
  });
});
