import { AccessibilityInfo, Platform, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import {
  announceForScreenReader,
  ScreenReaderOrderScope,
  useScreenReaderOrder,
  useScreenReaderProps,
  withPressAnnouncement,
} from './index';

const originalOS = Platform.OS;

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  jest.restoreAllMocks();
});

function Stop({ text, order, hidden }: { text: string; order?: number; hidden?: boolean }) {
  const props = useScreenReaderProps({ screenReaderOrder: order, hideFromScreenReader: hidden });
  return <Text {...props}>{text}</Text>;
}

const nativeOrder = (testID = 'scope'): string[] | undefined =>
  screen.getByTestId(testID).props.experimental_accessibilityOrder;
const idOf = (text: string) => screen.getByText(text, { includeHiddenElements: true }).props.nativeID;
const readOrder = (testID = 'scope') => (nativeOrder(testID) ?? []).map((id) =>
  screen.container.queryAll((node) => typeof node.type === 'string' && node.props.nativeID === id)[0]?.props.children,
);

it('reads numbered stops lowest first, whatever their source order', async () => {
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Save" order={3} />
      <Stop text="Title" order={1} />
      <Stop text="Error" order={2} />
    </ScreenReaderOrderScope>,
  );
  expect(readOrder()).toEqual(['Title', 'Error', 'Save']);
});

it('adds and removes conditional stops as they mount', async () => {
  const page = (showError: boolean) => (
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Title" order={1} />
      {showError ? <Stop text="Error" order={2} /> : null}
      <Stop text="Save" order={3} />
    </ScreenReaderOrderScope>
  );
  await render(page(false));
  expect(readOrder()).toEqual(['Title', 'Save']);

  await screen.rerender(page(true));
  expect(readOrder()).toEqual(['Title', 'Error', 'Save']);

  await screen.rerender(page(false));
  expect(readOrder()).toEqual(['Title', 'Save']);
});

it('follows a changed number', async () => {
  const page = (saveFirst: boolean) => (
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Title" order={2} />
      <Stop text="Save" order={saveFirst ? 1 : 3} />
    </ScreenReaderOrderScope>
  );
  await render(page(false));
  expect(readOrder()).toEqual(['Title', 'Save']);
  await screen.rerender(page(true));
  expect(readOrder()).toEqual(['Save', 'Title']);
});

it('keeps mount order for equal numbers', async () => {
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="First" order={1} />
      <Stop text="Second" order={1} />
    </ScreenReaderOrderScope>,
  );
  expect(readOrder()).toEqual(['First', 'Second']);
});

it('keeps mount order when a number changes to match another', async () => {
  const page = (aOrder: number) => (
    <ScreenReaderOrderScope testID="scope">
      <Stop text="A" order={aOrder} />
      <Stop text="B" order={2} />
    </ScreenReaderOrderScope>
  );
  await render(page(1));
  const aID = idOf('A');
  expect(readOrder()).toEqual(['A', 'B']);

  await screen.rerender(page(2));
  expect(idOf('A')).toBe(aID); // same stop, not remounted
  expect(readOrder()).toEqual(['A', 'B']);
});

it('leaves hidden stops out of the order', async () => {
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Title" order={1} />
      <Stop text="Decoration" order={2} hidden />
    </ScreenReaderOrderScope>,
  );
  expect(readOrder()).toEqual(['Title']);
  const decoration = screen.getByText('Decoration', { includeHiddenElements: true });
  expect(decoration.props).toMatchObject({
    'aria-hidden': true,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });
});

it('places a nested scope in the outer order by its own number', async () => {
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Footer" order={2} />
      <ScreenReaderOrderScope testID="inner" screenReaderOrder={1}>
        <Stop text="B" order={2} />
        <Stop text="A" order={1} />
      </ScreenReaderOrderScope>
    </ScreenReaderOrderScope>,
  );
  expect(nativeOrder()).toEqual([screen.getByTestId('inner').props.nativeID, idOf('Footer')]);
  expect(readOrder('inner')).toEqual(['A', 'B']);
});

it('uses the default order when nothing is numbered', async () => {
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Title" />
    </ScreenReaderOrderScope>,
  );
  expect(nativeOrder()).toBeUndefined();
  expect(idOf('Title')).toBeUndefined();
});

it('leaves web reading order to the source', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  await render(
    <ScreenReaderOrderScope testID="scope">
      <Stop text="Save" order={2} />
      <Stop text="Title" order={1} />
    </ScreenReaderOrderScope>,
  );
  expect(nativeOrder()).toBeUndefined();
});

it('warns when a number is used outside a scope', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  function Lonely() {
    const id = useScreenReaderOrder(1);
    return <Text nativeID={id}>Lonely</Text>;
  }
  await render(<Lonely />);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('ScreenReaderOrderScope'));
});

describe('announcements', () => {
  it('speaks through announceForAccessibility on iOS and Android', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    announceForScreenReader('Saved');
    expect(announce).toHaveBeenCalledWith('Saved');
  });

  it('runs the press handler first, then announces', () => {
    const calls: string[] = [];
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation((m) => {
      calls.push(`announce ${m}`);
    });
    withPressAnnouncement(() => calls.push('press'), 'Saved')?.();
    expect(calls).toEqual(['press', 'announce Saved']);
  });

  it('returns the handler unchanged without an announcement', () => {
    const handler = jest.fn();
    expect(withPressAnnouncement(handler, undefined)).toBe(handler);
  });

  it('uses a polite live region on the web', () => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const region = { isConnected: true, style: {}, textContent: '', setAttribute: jest.fn() };
    const appendChild = jest.fn();
    const global = globalThis as { document?: unknown };
    const originalDocument = global.document;
    global.document = { createElement: () => region, body: { appendChild } };
    try {
      announceForScreenReader('Saved');
      expect(appendChild).toHaveBeenCalledWith(region);
      expect(region.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      jest.advanceTimersByTime(100);
      expect(region.textContent).toBe('Saved');
    } finally {
      global.document = originalDocument;
      jest.useRealTimers();
    }
  });
});
