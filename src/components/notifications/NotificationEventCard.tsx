import { Text, View } from 'react-native';
import { getEventWhen, getInitials } from '@/components/events/eventFormat';
import { EventWithId } from '@/types';

type Props = {
  event: EventWithId;
  teamName: string;
  joined?: boolean;
};

// Compact event summary shown on the announcement detail screen.
export function NotificationEventCard({ event, teamName, joined = true }: Props) {
  const when = getEventWhen(event.startTime, event.endTime);
  const initials = getInitials(teamName);
  const locationShort = event.location.split(',')[0]?.trim() || event.location;

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-sans-bold text-base text-white">
        Event
      </Text>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${event.title}. ${when.spoken}. ${event.location}. ${teamName}${
          joined ? '. Joined' : ''
        }`}
        className="rounded-xl bg-surface-alt-dark p-4"
      >
        <View className="flex-row gap-3">
          <View className="w-14 items-center rounded bg-black py-2">
            <Text className="font-sans-bold text-sm text-brand">{when.monthShort}</Text>
            <Text className="font-sans-bold text-3xl text-brand">{when.day}</Text>
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="shrink font-sans-bold text-lg text-white">{event.title}</Text>
              <View className="h-7 min-w-7 items-center justify-center rounded bg-brand px-1.5">
                <Text className="font-sans-bold text-xs text-on-brand">{initials}</Text>
              </View>
            </View>
            <Text className="font-sans text-base text-white">{when.timeRange}</Text>
            <View className="flex-row items-end justify-between gap-2">
              <Text className="shrink font-sans text-base text-ink-subtle">{locationShort}</Text>
              {joined ? (
                <Text className="font-sans text-sm text-ink-muted-dark">Joined</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
