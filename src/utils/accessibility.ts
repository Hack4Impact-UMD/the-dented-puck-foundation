// Helpers for moving screen reader focus
import {
  AccessibilityInfo,
  Platform,
  type PressableInstance,
  type TextInputInstance,
  type TextInstance,
  type ViewInstance,
} from 'react-native';

// How long to wait before calling focusAccessibility after a screen change or button press.
// If focus is moved while the screen is still animating, VoiceOver/TalkBack ignore it
// and pick their own spot. If focus lands in the wrong place on a device, try raising this.
export const SCREEN_READER_FOCUS_DELAY_MS = 300;

export type FocusTarget = ViewInstance | TextInstance | TextInputInstance | PressableInstance;

// Moves the screen reader to the given element.
export function focusAccessibility(target: FocusTarget | null) {
  if (!target) return;
  if (Platform.OS === 'web') target.focus();
  else AccessibilityInfo.sendAccessibilityEvent(
    target as unknown as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0], 'focus',
  );
}
