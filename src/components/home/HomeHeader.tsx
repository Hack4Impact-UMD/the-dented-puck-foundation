import { useContext, useEffect, useRef } from 'react';
import { AccessibilityInfo, Image, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { HomeWordmark } from '@/components/home/HomeWordmark';
import { HomeSearchField } from '@/components/home/HomeSearchField';
import type { useHomeTitleFocus } from '@/hooks/useHomeTitleFocus';
import { HomeAnnouncementContext } from '@/hooks/useHomeAnnouncement';

const bell = require('@/assets/home/notification-bell.png');

export function HomeHeader({ search, entryFocus }: { entryFocus?: ReturnType<typeof useHomeTitleFocus>; search?: {
  query: string; active: boolean; returnFocusRequest?: number; onFocus: () => void; onChangeQuery: (query: string) => void; onCancel: () => void;
} }) {
  const { state, destinations } = useHomeDashboard();
  const count = state.unreadCount;
  const previousCount = useRef<{ uid: string; count: number } | null>(null);
  const uid = state.viewer?.uid;
  const announcementsEnabled = useContext(HomeAnnouncementContext);
  const countLabel = count === null ? 'Notification status unavailable'
    : count === 0 ? 'No new notifications' : `${count} new notification${count === 1 ? '' : 's'}`;

  useEffect(() => {
    // Keep the last known count through a refresh, but compare only within the
    // same account. An unavailable count is neither zero nor a new baseline.
    if (count === null || !uid) return;
    const previous = previousCount.current;
    if (announcementsEnabled && Platform.OS === 'ios' && previous?.uid === uid && count > previous.count) {
      AccessibilityInfo.announceForAccessibilityWithOptions(`Notifications, ${countLabel}`, { queue: false, priority: 'low' });
    }
    previousCount.current = { uid, count };
  }, [announcementsEnabled, count, countLabel, uid]);

  return <>
    <View accessibilityElementsHidden={entryFocus?.pending} importantForAccessibility={entryFocus?.pending ? 'no-hide-descendants' : 'auto'} className="flex-row items-center justify-between px-4 pb-[13px]">
      <HomeWordmark />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={Platform.OS === 'ios' ? 'Notifications' : `Notifications, ${countLabel.toLowerCase()}`}
        accessibilityValue={Platform.OS === 'ios' ? { text: countLabel } : undefined}
        accessibilityState={{ disabled: !destinations.notifications }}
        accessibilityHint={destinations.notifications ? 'Opens notifications' : 'Notifications are not available yet'}
        accessibilityLiveRegion={Platform.OS === 'android' && announcementsEnabled ? 'polite' : undefined}
        disabled={!destinations.notifications}
        hitSlop={8}
        onPress={destinations.notifications ? () => router.push(destinations.notifications!) : undefined}
        className="h-10 w-10 items-center justify-center active:opacity-70"
      >
        <View className={`h-10 w-10 items-center justify-center rounded-full border-2 ${count && count > 0 ? 'border-brand' : 'border-white'}`}>
          <Image accessible={false} importantForAccessibility="no" source={bell} style={{ width: 24, height: 24 }} />
          {!!count && count > 0 && <View accessible={false} importantForAccessibility="no" className="absolute left-[22px] top-[11px] h-[9px] w-[9px] rounded-full bg-brand" />}
        </View>
      </Pressable>
    </View>
    <View className="gap-[15px] px-4">
      <Text ref={entryFocus?.title} onLayout={entryFocus?.onTitleLayout} accessible accessibilityRole="header" className="font-sans-bold text-[32px] leading-10 text-white">
        {state.viewer ? `Welcome back, ${state.viewer.name}` : 'Welcome to The Dented Puck'}
      </Text>
      <View accessibilityElementsHidden={entryFocus?.pending} importantForAccessibility={entryFocus?.pending ? 'no-hide-descendants' : 'auto'} className="gap-1">
        <HomeSearchField query={search?.query ?? ''} returnFocusRequest={search?.returnFocusRequest} enabled={state.phase === 'ready'} onFocus={search?.onFocus} onChangeQuery={search?.onChangeQuery} />
        {search?.active && <Pressable accessibilityRole="button" accessibilityLabel="Cancel search" onPress={search.onCancel}
          className="min-h-12 justify-center self-end px-2 active:opacity-70">
          <Text className="font-sans-bold text-lg text-brand">Cancel</Text>
        </Pressable>}
      </View>
    </View>
    <View className="my-6 h-px bg-line" />
  </>;
}
