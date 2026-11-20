import { useCallback, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

const searchIcon = require('@/assets/home/search.png');

export function HomeSearchField({ query, onChangeQuery, onFocus, enabled = true, returnFocusRequest = 0 }: {
  query: string; onChangeQuery?: (query: string) => void; onFocus?: () => void; enabled?: boolean; returnFocusRequest?: number;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const restored = useRef(0);
  const restoringWebFocus = useRef(false);
  const clearFrame = useRef<number | null>(null);
  useFocusEffect(useCallback(() => {
    if (!returnFocusRequest) restored.current = 0;
    const frame = enabled && returnFocusRequest > restored.current ? requestAnimationFrame(() => {
      if (!input.current) return;
      restored.current = returnFocusRequest;
      if (Platform.OS === 'web') {
        // Returning keyboard focus must not immediately reopen the results.
        restoringWebFocus.current = true;
        input.current.focus();
        restoringWebFocus.current = false;
      } else AccessibilityInfo.sendAccessibilityEvent(input.current, 'focus');
    }) : null;
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (clearFrame.current !== null) cancelAnimationFrame(clearFrame.current);
    };
  }, [enabled, returnFocusRequest]));
  return <View className="min-h-14 flex-row items-center gap-3 rounded bg-surface-field pl-3.5 pr-1">
    <Image accessible={false} importantForAccessibility="no" source={searchIcon} style={{ width: 24, height: 24 }} />
    <TextInput ref={input} accessibilityRole="search" accessibilityLabel="Search team, event, or city"
      accessibilityHint={enabled ? 'Search events by title, team, venue, or city' : 'Sign in to search'}
      accessibilityState={{ disabled: !enabled }} editable={enabled}
      value={query} onChangeText={onChangeQuery} onFocus={() => { if (!restoringWebFocus.current) onFocus?.(); }} autoCapitalize="none" autoCorrect={false} maxLength={120}
      returnKeyType="search" placeholder="Search team, event, or city" placeholderTextColor="#C9C9C9" selectionColor="#FFD101"
      className="min-h-14 min-w-0 flex-1 py-3 font-sans text-lg leading-6 text-white"
      style={{ textAlignVertical: 'center', includeFontPadding: false }} />
    {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => {
      onChangeQuery?.('');
      input.current?.focus();
      // The Clear button disappears; native keyboard focus alone doesn't
      // return VoiceOver/TalkBack focus to the surviving search field.
      if (clearFrame.current !== null) cancelAnimationFrame(clearFrame.current);
      clearFrame.current = requestAnimationFrame(() => {
        clearFrame.current = null;
        if (Platform.OS !== 'web' && input.current) AccessibilityInfo.sendAccessibilityEvent(input.current, 'focus');
      });
    }}
      className="min-h-12 min-w-12 items-center justify-center px-2 active:opacity-70"><Text className="font-sans-bold text-lg text-brand">Clear</Text></Pressable>}
  </View>;
}
