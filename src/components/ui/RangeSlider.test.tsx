import { useState } from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RangeSlider } from './RangeSlider';

const originalOS = Platform.OS;

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

function AgeRange({ onChange }: { onChange?: (low: number, high: number) => void }) {
  const [range, setRange] = useState({ low: 12, high: 40 });
  return (
    <RangeSlider
      label="Age range"
      valueName="age"
      min={0}
      max={99}
      low={range.low}
      high={range.high}
      onChange={(low, high) => {
        onChange?.(low, high);
        setRange({ low, high });
      }}
    />
  );
}

describe('value boxes', () => {
  it('can be cleared while typing, and apply the typed value when they lose focus', async () => {
    const onChange = jest.fn();
    await render(<AgeRange onChange={onChange} />);
    const minimum = screen.getByLabelText('Minimum age');

    await fireEvent.changeText(minimum, '');
    expect(minimum.props.value).toBe('');
    await fireEvent.changeText(minimum, '18');
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent(minimum, 'blur');
    expect(onChange).toHaveBeenLastCalledWith(18, 40);
    expect(minimum.props.value).toBe('18');
  });

  it('clamp the typed value when it is submitted', async () => {
    const onChange = jest.fn();
    await render(<AgeRange onChange={onChange} />);
    const minimum = screen.getByLabelText('Minimum age');

    await fireEvent.changeText(minimum, '55');
    await fireEvent(minimum, 'submitEditing');
    expect(onChange).toHaveBeenLastCalledWith(40, 40);
  });

  it('go back to the current value when left empty', async () => {
    const onChange = jest.fn();
    await render(<AgeRange onChange={onChange} />);
    const maximum = screen.getByLabelText('Maximum age');

    await fireEvent.changeText(maximum, '');
    await fireEvent(maximum, 'blur');
    expect(onChange).not.toHaveBeenCalled();
    expect(maximum.props.value).toBe('40');
  });
});

describe('thumbs on the web', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  });

  const key = (name: string) => ({ nativeEvent: { key: name }, preventDefault: jest.fn() });

  // aria-value* can't be checked here: Jest renders React Native, which folds them into accessibilityValue.
  it('are focusable', async () => {
    await render(<AgeRange />);
    expect(screen.getByLabelText('Minimum age slider').props.tabIndex).toBe(0);
  });

  it('move with the slider keys, staying inside the range', async () => {
    const onChange = jest.fn();
    await render(<AgeRange onChange={onChange} />);
    const thumb = () => screen.getByLabelText('Maximum age slider');

    const up = key('ArrowUp');
    await fireEvent(thumb(), 'keyDown', up);
    expect(up.preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(12, 41);

    await fireEvent(thumb(), 'keyDown', key('PageDown'));
    expect(onChange).toHaveBeenLastCalledWith(12, 31);

    await fireEvent(thumb(), 'keyDown', key('Home'));
    expect(onChange).toHaveBeenLastCalledWith(12, 12);

    await fireEvent(thumb(), 'keyDown', key('End'));
    expect(onChange).toHaveBeenLastCalledWith(12, 99);
  });

  it('leave the Tab order when hidden', async () => {
    await render(<RangeSlider label="Age range" min={0} max={99} low={12} high={40} onChange={() => {}} hideFromScreenReader />);
    const thumb = screen.getByLabelText('Minimum age range slider', { includeHiddenElements: true });
    expect(thumb.props.tabIndex).toBe(-1);
  });
});
