import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { HomeTab } from '@/hooks/useHomeTabTransition';

export function HomeViewTabs({ tab, indicator, onSelect }: { tab: HomeTab; indicator: Animated.Value; onSelect: (tab: HomeTab) => void }) {
  const { focusTab } = useLocalSearchParams<{ focusTab?: string }>();
  const forYouTab = useRef<ComponentRef<typeof View>>(null);
  const discoverTab = useRef<ComponentRef<typeof View>>(null);
  const selectedTab = tab === 'discover' ? discoverTab : forYouTab;
  const [width, setWidth] = useState(0);

  useFocusEffect(useCallback(() => {
    if (focusTab !== '1') return;
    // Wait until the destination's selected control has been laid out. A blur
    // before that frame must not send focus back into an inactive screen.
    const frame = requestAnimationFrame(() => {
      if (!selectedTab.current) return;
      if (Platform.OS === 'web') selectedTab.current.focus();
      else AccessibilityInfo.sendAccessibilityEvent(selectedTab.current, 'focus');
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTab, selectedTab]));

  return <View className="rounded-lg bg-surface-field p-[5px]">
    <View accessibilityRole={Platform.OS === 'ios' ? undefined : 'tablist'} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} className="flex-row">
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      className="absolute bottom-0 left-0 top-0 w-1/2 rounded bg-brand"
      style={{ opacity: width > 0 ? 1 : 0, transform: [{ translateX: indicator.interpolate({ inputRange: [0, 1], outputRange: [0, width / 2] }) }] }}
    />
    {(['for-you', 'discover'] as const).map((value, index) => {
      const selected = tab === value;
      return <Pressable
        key={value}
        ref={value === 'discover' ? discoverTab : forYouTab}
        accessible
        focusable
        accessibilityRole={Platform.OS === 'ios' ? 'button' : 'tab'}
        accessibilityLabel={value === 'for-you' ? 'For You' : 'Discover'}
        // Custom RN tabs do not inherit a native TabLayout's item positions.
        accessibilityValue={Platform.OS !== 'web' ? { text: `${index + 1} of 2` } : undefined}
        accessibilityState={{ selected }}
        onPress={() => { if (!selected) onSelect(value); }}
        className={`min-h-14 min-w-0 flex-1 items-center justify-center rounded px-1.5 py-3 active:opacity-70 ${selected && !width ? 'bg-brand' : ''}`}
      >
        <Text className={`w-full text-center font-sans-bold text-xl ${selected ? 'text-black' : 'text-brand'}`}>{value === 'for-you' ? 'For You' : 'Discover'}</Text>
      </Pressable>;
    })}
    </View>
  </View>;
}
