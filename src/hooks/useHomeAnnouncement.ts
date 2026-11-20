import { createContext, useCallback, useContext, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

// Home entry owns the first spoken item. Child feedback waits for title focus.
export const HomeAnnouncementContext = createContext(true);

/** Debounced, replaceable feedback; don't build a queue of obsolete results. */
export function useHomeAnnouncement(message: string | null, delay = 300, announceOnMount = true) {
  const spoken = useRef<string | null>(announceOnMount ? null : message);
  const enabled = useContext(HomeAnnouncementContext);

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    if (!message) { spoken.current = null; return; }
    if (Platform.OS === 'web' || spoken.current === message) return;
    // Let focus/keyboard changes settle; typing replaces the pending result count.
    const timer = setTimeout(() => {
      spoken.current = message;
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: false, priority: 'low' });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, enabled, message]));
}
