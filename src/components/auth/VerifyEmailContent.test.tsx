import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import VerifyEmailContent from './VerifyEmailContent';

const originalOS = Platform.OS;

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

it('keeps conditional feedback in the verification reading sequence', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const props = {
    email: 'player@example.com',
    isLoadingUser: false,
    isResending: false,
    message: null,
    onBack: jest.fn(),
    onClose: jest.fn(),
    onResend: jest.fn(),
  };
  const screen = await render(<VerifyEmailContent {...props} />);
  const configuredOrder = () => screen.container.queryAll(
    node => Array.isArray(node.props.experimental_accessibilityOrder),
  )[0].props.experimental_accessibilityOrder;
  const initialOrder = [
    'verify-email-back', 'verify-email-title', 'verify-email-close',
    'verify-email-instructions', 'verify-email-resend', 'verify-email-expiry',
  ];
  expect(configuredOrder()).toEqual(initialOrder);

  await screen.rerender(
    <VerifyEmailContent {...props} message={{ type: 'error', text: 'Please try again.' }} />,
  );
  expect(configuredOrder()).toEqual([
    ...initialOrder.slice(0, 4), 'verify-email-feedback', ...initialOrder.slice(4),
  ]);
  expect(screen.getByRole('alert', { name: 'Please try again.' })).toBeTruthy();

  await screen.rerender(<VerifyEmailContent {...props} />);
  expect(configuredOrder()).toEqual(initialOrder);
  expect(screen.queryByText('Please try again.')).toBeNull();
});
