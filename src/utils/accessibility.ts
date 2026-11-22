import { AccessibilityInfo, Platform } from 'react-native';
import type { RefObject } from 'react';

// iOS can queue the message behind current speech; Android has no queue option.
export function announce(message: string) {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

// Wait a moment so an error has rendered before focus moves to the field.
export function focusOn(ref: RefObject<any>) {
  setTimeout(() => {
    if (ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
  }, 150);
}
