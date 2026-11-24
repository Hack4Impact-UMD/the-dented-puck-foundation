import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { redirectSystemPath } from '@/app/+native-intent';
import PasswordUpdatedScreen from '@/app/auth/password-updated';
import ResetPasswordScreen from '@/app/auth/reset-password';
import { resetPassword, verifyResetLink } from '@/services/authService';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services/authService', () => ({
  getAuthFormError: jest.requireActual('@/services/authService').getAuthFormError,
  verifyResetLink: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock('@/firebase', () => ({ auth: {}, db: {}, storage: {} }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  jest.mocked(useLocalSearchParams).mockReturnValue({ oobCode: 'reset-code' });
  jest.mocked(verifyResetLink).mockResolvedValue('jordan.lee@gmail.com');
});

describe('opening the app from the reset email', () => {
  const actionLink = 'https://denton-puck.firebaseapp.com/__/auth/action?apiKey=k&mode=resetPassword&oobCode=abc%2B123&lang=en';

  it('sends Firebase reset links to the New password screen', () => {
    const appLink = `https://denton-puck.firebaseapp.com/__/auth/links?link=${encodeURIComponent(actionLink)}`;
    expect(redirectSystemPath({ path: appLink, initial: true })).toBe('/auth/reset-password?oobCode=abc%2B123');
    expect(redirectSystemPath({ path: actionLink, initial: false })).toBe('/auth/reset-password?oobCode=abc%2B123');
  });

  it('leaves every other link alone', () => {
    expect(redirectSystemPath({ path: '/invite/team-token', initial: true })).toBe('/invite/team-token');
    expect(redirectSystemPath({ path: 'not a url %%', initial: true })).toBe('not a url %%');
  });
});

describe('new password (Figma 5400/5410)', () => {
  it('names the account and reads the password rule as a hint', async () => {
    const screen = await render(<ResetPasswordScreen />);
    await waitFor(() => expect(screen.getByText('Choose a new password for jordan.lee@gmail.com.')).toBeTruthy());
    expect(screen.getByLabelText('New Password').props.accessibilityHint).toBe('At least 8 characters, with one number');
  });

  it('names the missing rule and keeps the code unused (5410)', async () => {
    const screen = await render(<ResetPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('New Password'), 'hockeyrules');
    await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
    expect(screen.getByText('Add at least one number.')).toBeTruthy();
    expect(screen.getByLabelText('New Password').props.accessibilityHint).toBe('Error: Add at least one number.');
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('saves and replaces the screen with Password updated', async () => {
    jest.mocked(resetPassword).mockResolvedValue(undefined);
    const screen = await render(<ResetPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('New Password'), 'hockey2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/auth/password-updated'));
    expect(resetPassword).toHaveBeenCalledWith('reset-code', 'hockey2026');
  });

  it('offers a new link when the link has expired', async () => {
    jest.mocked(verifyResetLink).mockRejectedValue(new FirebaseError('auth/expired-action-code', 'expired'));
    const screen = await render(<ResetPasswordScreen />);
    await waitFor(() => expect(screen.getByText('This link has expired or was already used.')).toBeTruthy());
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('This link has expired or was already used.');
    await fireEvent.press(screen.getByRole('button', { name: 'Send a new link' }));
    expect(router.replace).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('closes to Login', async () => {
    const screen = await render(<ResetPasswordScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(router.dismissTo).toHaveBeenCalledWith('/auth/login');
  });
});

describe('password updated (Figma 5500)', () => {
  it('starts with the heading, hides the check icon, and logs in from Login', async () => {
    const screen = await render(<PasswordUpdatedScreen />);
    expect(screen.getByRole('header', { name: 'Password updated' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
    expect(router.dismissTo).toHaveBeenCalledWith('/auth/login');
  });
});
