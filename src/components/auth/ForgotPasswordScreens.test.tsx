import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import CheckEmailScreen from '@/app/auth/check-email';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import { sendPasswordReset } from '@/services/authService';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services/authService', () => ({
  getAuthFormError: jest.requireActual('@/services/authService').getAuthFormError,
  sendPasswordReset: jest.fn(),
}));
jest.mock('@/firebase', () => ({ auth: {}, db: {}, storage: {} }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  jest.mocked(useLocalSearchParams).mockReturnValue({ email: 'jordan.lee@gmail.com' });
});

describe('forgot password (Figma 5200/5210)', () => {
  it('starts with the email carried over from Login', async () => {
    const screen = await render(<ForgotPasswordScreen />);
    expect(screen.getByLabelText('Email').props.value).toBe('jordan.lee@gmail.com');
  });

  it('rejects an invalid email on tap without sending (5210)', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    const screen = await render(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'jordan.lee@gmail');
    expect(screen.queryByText('Enter an email like name@example.com.')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText('Enter an email like name@example.com.')).toBeTruthy();
    expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Error: Enter an email like name@example.com.');
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('sends the link and replaces the screen with Check your email', async () => {
    jest.mocked(sendPasswordReset).mockResolvedValue(undefined);
    const screen = await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith({
      pathname: '/auth/check-email',
      params: { email: 'jordan.lee@gmail.com' },
    }));
    expect(sendPasswordReset).toHaveBeenCalledWith('jordan.lee@gmail.com');
  });

  it('shows connection problems as a form error', async () => {
    jest.mocked(sendPasswordReset).mockRejectedValue(new FirebaseError('auth/network-request-failed', 'offline'));
    const screen = await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByText('No internet connection. Check your connection and try again.')).toBeTruthy());
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('returns to Login from Close and Back to Log in', async () => {
    const screen = await render(<ForgotPasswordScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Log in' }));
    expect(router.dismissTo).toHaveBeenCalledTimes(2);
    expect(router.dismissTo).toHaveBeenCalledWith('/auth/login');
  });
});

describe('check your email (Figma 5300)', () => {
  it('starts screen-reader focus on the confirmation instead of the title', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
    await render(<CheckEmailScreen />);
    // AuthScreen focuses the title first; the confirmation takes over once the screen has opened
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(2));
    const [target] = focus.mock.calls[1];
    expect(String((target as unknown as { props: { children: string } }).props.children)).toMatch(/^If there’s a Dented Puck account/);
  });

  it('shows the email as read-only text, not a text field', async () => {
    const screen = await render(<CheckEmailScreen />);
    const email = screen.getByLabelText('jordan.lee@gmail.com');
    expect(email.props.accessibilityRole).toBe('text');
    expect(screen.queryByRole('textbox' as never)).toBeNull();
  });

  it('resends the link and announces "Link sent"', async () => {
    jest.mocked(sendPasswordReset).mockResolvedValue(undefined);
    const screen = await render(<CheckEmailScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset link again' }));
    await waitFor(() => expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Link sent'));
    expect(sendPasswordReset).toHaveBeenCalledWith('jordan.lee@gmail.com');
  });

  it('goes back to an empty Forgot password for a different email', async () => {
    const screen = await render(<CheckEmailScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Use a different email' }));
    expect(router.replace).toHaveBeenCalledWith('/auth/forgot-password');
  });
});
