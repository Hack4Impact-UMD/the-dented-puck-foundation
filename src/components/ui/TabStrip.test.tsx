import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TabStrip } from './TabStrip';

const originalOS = Platform.OS;
const TABS = [
  { value: 'channels', label: 'Channels' },
  { value: 'messages', label: 'Messages' },
] as const;

const key = (name: string) => ({ nativeEvent: { key: name }, preventDefault: jest.fn() });

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

// aria-selected can't be checked here: Jest renders React Native, which folds it into accessibilityState.
it('is one Tab stop on the web, on the selected tab', async () => {
  await render(<TabStrip value="messages" onChange={() => {}} tabs={[...TABS]} />);
  expect(screen.getByRole('tab', { name: 'Channels' }).props.tabIndex).toBe(-1);
  expect(screen.getByRole('tab', { name: 'Messages' }).props.tabIndex).toBe(0);
});

it('moves focus with arrow keys without opening the tab, and opens the focused tab with Space', async () => {
  const onChange = jest.fn();
  await render(<TabStrip value="channels" onChange={onChange} tabs={[...TABS]} />);

  const right = key('ArrowRight');
  await fireEvent(screen.getByRole('tab', { name: 'Channels' }), 'keyDown', right);
  expect(right.preventDefault).toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();

  const space = key(' ');
  await fireEvent(screen.getByRole('tab', { name: 'Messages' }), 'keyDown', space);
  expect(space.preventDefault).toHaveBeenCalled();
  expect(onChange).toHaveBeenCalledWith('messages');
});
