import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

export type HomeTab = 'for-you' | 'discover';

const tabIndex = (tab: HomeTab) => tab === 'discover' ? 1 : 0;
const timing = { easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web', isInteraction: false };

export function useHomeTabTransition(tab: HomeTab) {
  const [selectedTab, setSelectedTab] = useState(tab);
  const [displayedTab, setDisplayedTab] = useState(tab);
  // Switch immediately until the device's motion preference is known.
  const [reduceMotion, setReduceMotion] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  const [indicator] = useState(() => new Animated.Value(tabIndex(tab)));
  const pendingTab = useRef<HomeTab | null>(null);
  const active = useRef(false);

  const navigate = useCallback((value: HomeTab) => {
    // Keep the dashboard mounted so the shell and scroll position stay steady.
    router.setParams({ view: value, focusTab: '1' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      changed = true;
      setReduceMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled && !changed) setReduceMotion(enabled);
    }).catch(() => { /* Retain the immediate transition if the preference is unavailable. */ });
    return () => { cancelled = true; subscription?.remove(); };
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true;
    pendingTab.current = null;
    setSelectedTab(tab);
    setDisplayedTab(tab);
    opacity.setValue(1);
    indicator.setValue(tabIndex(tab));
    return () => {
      active.current = false;
      pendingTab.current = null;
      opacity.stopAnimation();
      indicator.stopAnimation();
    };
  }, [indicator, opacity, tab]));

  useEffect(() => {
    if (displayedTab === tab || pendingTab.current !== displayedTab) return;
    // Start only after React commits the new content at zero opacity.
    const animation = Animated.timing(opacity, { ...timing, toValue: 1, duration: 180 });
    animation.start(({ finished }) => {
      if (finished && active.current && pendingTab.current === displayedTab) navigate(displayedTab);
    });
    return () => animation.stop();
  }, [displayedTab, navigate, opacity, tab]);

  useEffect(() => {
    if (!reduceMotion || !pendingTab.current) return;
    const target = pendingTab.current;
    pendingTab.current = null;
    opacity.stopAnimation();
    indicator.stopAnimation();
    opacity.setValue(1);
    indicator.setValue(tabIndex(target));
    navigate(target);
  }, [indicator, navigate, opacity, reduceMotion]);

  const selectTab = useCallback((value: HomeTab) => {
    if (value === tab || pendingTab.current || !active.current) return;
    if (reduceMotion) { navigate(value); return; }
    pendingTab.current = value;
    setSelectedTab(value);
    Animated.timing(indicator, { ...timing, toValue: tabIndex(value), duration: 270 }).start();
    Animated.timing(opacity, { ...timing, toValue: 0, duration: 90 }).start(({ finished }) => {
      if (finished && active.current && pendingTab.current === value) setDisplayedTab(value);
    });
  }, [indicator, navigate, opacity, reduceMotion, tab]);

  const direction = selectedTab === 'discover' ? 1 : -1;
  const offset = displayedTab === tab ? -direction * 12 : direction * 12;
  return {
    selectedTab, displayedTab, selectTab, indicator,
    contentStyle: { opacity, transform: [{ translateX: opacity.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }] },
  };
}
