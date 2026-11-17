import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationDetail } from '@/components/notifications/NotificationDetail';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { getEvent, getTeamByTeamId } from '@/services/eventService';
import { markNotificationRead, markNotificationUnread } from '@/services/notificationService';

export default function NotificationDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  // Opening a notification marks it read, then refreshes the list and the bell count.
  useEffect(() => {
    if (!eventId) return;
    markNotificationRead(eventId).then(() =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    );
  }, [eventId, queryClient]);

  // Moves it back to the Unread tab and returns to the list.
  const markUnread = async () => {
    await markNotificationUnread(eventId);
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    router.back();
  };

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

      {!event ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text accessibilityRole="header" className="text-center text-xl text-white">
            Event not found
          </Text>
        </View>
      ) : (
        <NotificationDetail event={event} teamName={teamName} onMarkUnread={markUnread} />
      )}
    </SafeAreaView>
  );
}
