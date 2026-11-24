import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, AppState, Platform, type Text } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Focus the settled screen title, rather than a feed row restored by iOS. */
export function useHomeTitleFocus({ ready, identity, blocked }: { ready: boolean; identity: string; blocked: boolean }) {
  const title = useRef<ComponentRef<typeof Text>>(null);
  const [laidOut, setLaidOut] = useState(false);
  const [finishedFor, setFinishedFor] = useState<string | null>(null);
  const blockFocus = useRef(blocked);
  useEffect(() => { blockFocus.current = blocked; }, [blocked]);

  useFocusEffect(useCallback(() => {
    if (!ready || !laidOut || Platform.OS === 'web') return;
    let active = true;
    let generation = 0;
    let frame: number | null = null;
    let backgrounded = AppState.currentState === 'background';
    const cancel = () => {
      ++generation;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const focus = () => {
      cancel();
      const request = generation;
      void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
        if (!active || request !== generation) return;
        if (!enabled || blockFocus.current) { setFinishedFor(identity); return; }
        frame = requestAnimationFrame(() => {
          frame = null;
          if (active && request === generation) {
            if (!blockFocus.current && title.current) AccessibilityInfo.sendAccessibilityEvent(title.current, 'focus');
            setFinishedFor(identity);
          }
        });
      }).catch(() => {
        // Keep content reachable if the native reader query fails.
        if (active && request === generation) setFinishedFor(identity);
      });
    };
    focus();
    const subscription = AppState.addEventListener('change', (next) => {
      // Permission prompts and Control Center use inactive; don't steal focus
      // when they close. A real background/reopen starts at the title again.
      if (next === 'background') { backgrounded = true; cancel(); setFinishedFor(null); }
      else if (next === 'active' && backgrounded) { backgrounded = false; focus(); }
    });
    return () => { active = false; cancel(); subscription.remove(); setFinishedFor(null); };
  }, [identity, laidOut, ready]));

  const onTitleLayout = useCallback(() => setLaidOut(true), []);
  return { title, onTitleLayout, pending: Platform.OS !== 'web' && finishedFor !== identity };
}
