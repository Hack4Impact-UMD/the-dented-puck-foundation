import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { HeaderBackButton } from './HeaderBackButton';

jest.mock('expo-router', () => ({ router: { canGoBack: jest.fn(), back: jest.fn() } }));
jest.mock('@react-native-vector-icons/ionicons', () => ({ Ionicons: () => null }));

describe('HeaderBackButton', () => {
  afterEach(() => jest.restoreAllMocks());

  it('goes back, labeled "Back" on iOS', async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(true);
    await render(<HeaderBackButton />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('is labeled "Navigate up" on Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    (router.canGoBack as jest.Mock).mockReturnValue(true);
    await render(<HeaderBackButton />);
    expect(screen.getByRole('button', { name: 'Navigate up' })).toBeTruthy();
  });

  it('is hidden when there is nowhere to go back to', async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    await render(<HeaderBackButton />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
