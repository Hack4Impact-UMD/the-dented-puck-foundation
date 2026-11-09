import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import LoginScreen from '@/app/auth/login';
import { getPostSignInRoute, signInWithEmail } from '@/services/authService';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));
jest.mock('@/services/authService', () => {
  const actual = jest.requireActual('@/services/authService');
  return {
    getAuthFormError: actual.getAuthFormError,
    signInWithEmail: jest.fn(),
    getPostSignInRoute: jest.fn(),
    continueWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
  };
});
jest.mock('@/firebase', () => ({ auth: {}, db: {}, storage: {} }));

describe('login screen (Figma 5100–5120)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  });

  it('shows and announces both empty-field errors without calling Firebase (5110)', async () => {
    const screen = await render(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Enter your email.')).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
    expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Error: Enter your email.');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Enter your email. Enter your password.');
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it('keeps the email, clears the password, and shows one alert for wrong credentials (5120)', async () => {
    jest.mocked(signInWithEmail).mockRejectedValue(new FirebaseError('auth/invalid-credential', 'wrong'));
    const screen = await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jordan.lee@gmail.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'hockey2025');
    await fireEvent.press(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByText('Email or password is incorrect.')).toBeTruthy());
    expect(screen.getByLabelText('Email or password is incorrect. Check them and try again, or reset your password.')).toBeTruthy();
    expect(screen.getByLabelText('Email').props.value).toBe('jordan.lee@gmail.com');
    expect(screen.getByLabelText('Password').props.value).toBe('');
    expect(getPostSignInRoute).not.toHaveBeenCalled();
  });

  it('goes where getPostSignInRoute says after a successful login', async () => {
    const user = { uid: 'test-user' };
    jest.mocked(signInWithEmail).mockResolvedValue(user as never);
    jest.mocked(getPostSignInRoute).mockResolvedValue('/tabs/home');
    const screen = await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jordan.lee@gmail.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'hockey2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/tabs/home'));
    expect(getPostSignInRoute).toHaveBeenCalledWith(user);
  });

  it('carries the typed email to Forgot password and sends Join now to signup', async () => {
    const screen = await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), ' jordan.lee@gmail.com ');
    await fireEvent.press(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/auth/forgot-password', params: { email: 'jordan.lee@gmail.com' } });

    await fireEvent.press(screen.getByRole('button', { name: 'Join now' }));
    expect(router.push).toHaveBeenCalledWith('/auth/signup');
  });
});
