import { useCallback, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Native counterpart to a polite web live region. Cancel stale speech on blur. */
export function useHomeAnnouncement(message: string | null, delay = 300, announceOnMount = true) {
  const spoken = useRef<string | null>(announceOnMount ? null : message);

  useFocusEffect(useCallback(() => {
    if (!message) { spoken.current = null; return; }
    if (Platform.OS === 'web' || spoken.current === message) return;
    // Let focus/keyboard changes settle; typing replaces the pending result count.
    const timer = setTimeout(() => {
      spoken.current = message;
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, message]));
}
