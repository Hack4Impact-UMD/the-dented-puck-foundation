import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from './SegmentedControl';

const originalOS = Platform.OS;
const OPTIONS = [
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' },
] as const;

const key = (name: string) => ({ nativeEvent: { key: name }, preventDefault: jest.fn() });

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

describe('on the web', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  });

  // aria-checked can't be checked here: Jest renders React Native, which folds it into accessibilityState.
  it('is one Tab stop, on the selected option', async () => {
    await render(<SegmentedControl label="Start time" value="pm" onChange={() => {}} options={[...OPTIONS]} />);
    expect(screen.getByRole('radio', { name: 'AM' }).props.tabIndex).toBe(-1);
    expect(screen.getByRole('radio', { name: 'PM' }).props.tabIndex).toBe(0);
  });

  it('selects the next option with an arrow key, wrapping, and the focused one with Space', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl label="Start time" value="am" onChange={onChange} options={[...OPTIONS]} />);

    const right = key('ArrowRight');
    await fireEvent(screen.getByRole('radio', { name: 'AM' }), 'keyDown', right);
    expect(onChange).toHaveBeenLastCalledWith('pm');
    expect(right.preventDefault).toHaveBeenCalled();

    await fireEvent(screen.getByRole('radio', { name: 'PM' }), 'keyDown', key('ArrowRight'));
    expect(onChange).toHaveBeenLastCalledWith('am');

    await fireEvent(screen.getByRole('radio', { name: 'PM' }), 'keyDown', key(' '));
    expect(onChange).toHaveBeenLastCalledWith('pm');

    onChange.mockClear();
    await fireEvent(screen.getByRole('radio', { name: 'AM' }), 'keyDown', key('a'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

it('adds no web-only props on iOS and Android', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  await render(<SegmentedControl label="Start time" value="am" onChange={() => {}} options={[...OPTIONS]} />);
  const am = screen.getByRole('radio', { name: 'AM' });
  expect(am.props.tabIndex).toBeUndefined();
  expect(am.props.onKeyDown).toBeUndefined();
  expect(am.props.accessibilityState).toMatchObject({ checked: true });
});
