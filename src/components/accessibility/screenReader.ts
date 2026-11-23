import { AccessibilityInfo, Platform } from 'react-native';
import { useScreenReaderOrder } from './ScreenReaderOrderContext';

// ---------------------------------------------------------------------------------------------
// Prop types shared by every UI-library component
// ---------------------------------------------------------------------------------------------

/** Every UI-library component takes these. */
export type ScreenReaderProps = {
  /**
   * Skip this component: VoiceOver, TalkBack and web screen readers don't read it or anything
   * inside it. Controls are also taken out of the web Tab order.
   */
  hideFromScreenReader?: boolean;
  /**
   * Position in the reading order of the nearest `ScreenReaderOrderScope` (lower numbers are
   * read first). Applies on iOS and Android; the web follows source order.
   */
  screenReaderOrder?: number;
};

/** A component that is a single, non-interactive reading stop. */
export type ScreenReaderStopProps = ScreenReaderProps & {
  /** Read when the screen reader focuses the component. Replaces the default spoken text. */
  screenReaderLabel?: string;
};

/** A component that is a single interactive reading stop (a button, tab, or row). */
export type ScreenReaderControlProps = ScreenReaderStopProps & {
  /** Read after the label when the control is focused: what activating it does. */
  screenReaderHint?: string;
  /** Spoken right after the control is activated, for example "Now following Baltimore Blades". */
  screenReaderPressAnnouncement?: string;
};

/** Spoken text for one non-interactive stop inside a component with several stops. */
export type ScreenReaderStopText = {
  /** Read when the stop is focused. */
  label?: string;
};

/** Spoken text for a text input inside a component with several stops. */
export type ScreenReaderFieldText = ScreenReaderStopText & {
  /** Read after the label when the field is focused. */
  hint?: string;
};

/** Spoken text for one control inside a component with several stops. */
export type ScreenReaderControlText = ScreenReaderStopText & {
  /** Read after the label when the control is focused: what activating it does. */
  hint?: string;
  /** Spoken right after the control is activated. */
  pressAnnouncement?: string;
};

// ---------------------------------------------------------------------------------------------
// Helpers used inside the components
// ---------------------------------------------------------------------------------------------

type HiddenProps = {
  'aria-hidden'?: true;
  accessibilityElementsHidden?: true;
  importantForAccessibility?: 'no-hide-descendants';
};

/** Hides an element and everything inside it from VoiceOver (iOS), TalkBack (Android) and the web. */
export function screenReaderHiddenProps(hidden: boolean | undefined): HiddenProps {
  return hidden
    ? { 'aria-hidden': true, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
    : {};
}

/**
 * For a control inside hidden content: on web, takes it out of the Tab order. A focusable element
 * that is hidden from screen readers would otherwise be reached with Tab and read without a name.
 */
export function skipFocusProps(hidden: boolean | undefined): { tabIndex?: -1 } {
  return hidden && Platform.OS === 'web' ? { tabIndex: -1 } : {};
}

/**
 * Props for a component's outermost element: hides it when `hideFromScreenReader` is set and
 * registers it with the nearest `ScreenReaderOrderScope` when `screenReaderOrder` is set.
 * Pass `nativeID` if the element already has one.
 */
export function useScreenReaderProps(
  { hideFromScreenReader, screenReaderOrder }: ScreenReaderProps,
  nativeID?: string,
): HiddenProps & { nativeID?: string } {
  // Hidden content isn't a reading stop, so it doesn't take a place in the order.
  const id = useScreenReaderOrder(hideFromScreenReader ? undefined : screenReaderOrder, nativeID);
  return { ...(id === undefined ? {} : { nativeID: id }), ...screenReaderHiddenProps(hideFromScreenReader) };
}

// ---------------------------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------------------------

let webLiveRegion: HTMLElement | null = null;

function announceOnWeb(message: string) {
  if (typeof document === 'undefined') return;
  if (!webLiveRegion?.isConnected) {
    webLiveRegion = document.createElement('div');
    webLiveRegion.setAttribute('role', 'status');
    webLiveRegion.setAttribute('aria-live', 'polite');
    // Visually hidden, but still in the accessibility tree.
    Object.assign(webLiveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(webLiveRegion);
  }
  // Clear first so the same message is spoken again on a repeat press.
  const region = webLiveRegion;
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 100);
}

/**
 * Speaks `message` with the active screen reader. Uses `announceForAccessibility` on iOS and
 * Android, and a shared polite live region on the web (where `announceForAccessibility` does nothing).
 */
export function announceForScreenReader(message: string) {
  if (Platform.OS === 'web') announceOnWeb(message);
  else AccessibilityInfo.announceForAccessibility(message);
}

/** Wraps a press handler so `announcement` is spoken after it runs. */
export function withPressAnnouncement<Args extends unknown[]>(
  handler: ((...args: Args) => void) | undefined,
  announcement: string | undefined,
): ((...args: Args) => void) | undefined {
  if (!announcement) return handler;
  return (...args: Args) => {
    handler?.(...args);
    announceForScreenReader(announcement);
  };
}
