import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationDetail } from '@/components/notifications/NotificationDetail';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { getEvent, getTeamByTeamId } from '@/services/eventService';
import { markNotificationRead, notificationsKey } from '@/services/notificationService';

export default function NotificationDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  // Opening a notification marks it read, then refreshes the list and the bell count.
  useEffect(() => {
    if (!eventId) return;
    markNotificationRead(eventId)
      .then(() => queryClient.invalidateQueries({ queryKey: notificationsKey() }))
      // If saving fails, it stays unread and tries again next time it's opened.
      .catch((error) => console.warn('Could not mark notification read', error));
  }, [eventId, queryClient]);

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
  });
  const event = eventQuery.data;

  const teamId = event?.teamIds[0];
  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamByTeamId(teamId!),
    enabled: teamId !== undefined,
  });
  const teamName = teamQuery.data?.name;

  if (eventQuery.isPending || (teamId !== undefined && teamQuery.isPending)) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        <NotificationHeader title="" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFD101" accessibilityLabel="Loading event" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <NotificationHeader title="" onBack={() => router.back()} />

      {eventQuery.isError ? (
        // The request failed, which is different from the event not existing.
        <View className="flex-1 items-center justify-center gap-4 px-4">
          <Text className="text-center text-lg text-white">Couldn&apos;t load event</Text>
          <Pressable
            onPress={() => eventQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Reloads the event"
            className="min-h-12 items-center justify-center rounded-md border border-brand px-4 active:opacity-70"
          >
            <Text className="font-sans-bold text-base text-brand">Try again</Text>
          </Pressable>
        </View>
      ) : !event ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text accessibilityRole="header" className="text-center text-xl text-white">
            Event not found
          </Text>
        </View>
      ) : (
        <NotificationDetail event={event} teamName={teamName} />
      )}
    </SafeAreaView>
  );
}
