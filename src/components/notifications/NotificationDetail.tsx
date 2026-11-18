import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { NotificationEventCard } from '@/components/notifications/NotificationEventCard';
import { formatNotificationDetailDate } from '@/components/notifications/notificationFormat';
import { EventWithId } from '@/types';

type Props = {
  event: EventWithId;
  teamName?: string;
};

export function NotificationDetail({ event, teamName }: Props) {
  const when = formatNotificationDetailDate(event.startTime);

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="px-4 pb-10 pt-2">
      <Text accessibilityRole="header" className="font-sans-bold text-3xl text-white">
        {event.title}
      </Text>
      <Text className="mt-2 font-sans text-base text-ink-muted-dark">{when}</Text>
      {teamName ? (
        <Text className="mt-1 font-sans text-base text-ink-muted-dark">{teamName}</Text>
      ) : null}

      {event.notes ? (
        <Text className="mt-6 font-sans text-lg leading-7 text-white">{event.notes}</Text>
      ) : null}

      <View className="mt-8 gap-6">
        <View className="h-px bg-line-dark" />
        <NotificationEventCard
          event={event}
          teamName={teamName || 'Team'}
          onPress={() =>
            router.push({ pathname: '/event/[eventId]', params: { eventId: event.id } })
          }
        />

        <Pressable
          // TODO: open the coach's chat once Ryan's chat room PR is merged.
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Message Coach"
          accessibilityHint="Chat with your coach is coming soon"
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-brand bg-[#2B2400] px-4 active:opacity-70"
        >
          <Ionicons name="chatbox-ellipses" size={20} color="#FFD101" />
          <Text className="font-sans-bold text-base text-brand">Message Coach</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
