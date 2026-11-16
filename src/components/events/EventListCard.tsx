import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import type { UpcomingEvent } from '@/services/eventService';
import { getEventWhen, getVenueAndCity } from './eventFormat';
import { listTeamNames } from './eventList';

// One event in the See All list (6300, annotation 4): a single stop that opens Event Details (6400).
// The label adds the team names after the annotation's wording, since the acronym badges are visual only.
export function EventListCard({ event }: { event: UpcomingEvent }) {
  const { fontScale } = useWindowDimensions();
  const when = getEventWhen(event.startTime, event.endTime);
  const place = getVenueAndCity(event.location);
  // At large text the acronyms move under the text so the title keeps its width.
  const stackBadges = fontScale > 1.3;

  const badges = event.teams.length > 0 && (
    // Up to two acronyms per row, so an event with several teams stays about the same height.
    <View className={stackBadges ? 'flex-row flex-wrap gap-2' : 'max-w-[104px] flex-row flex-wrap justify-end gap-2 self-start'}>
      {event.teams.map((team) => (
        <View key={team.id} className="rounded border border-brand bg-brand-soft-dark px-2 py-0.5">
          <Text className="font-sans-bold text-base text-brand">{team.acronym}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={[event.title, when.spoken, place, listTeamNames(event.teams)].filter(Boolean).join(', ')}
      onPress={() => router.push({ pathname: '/event/[eventId]', params: { eventId: event.id } })}
      className="min-h-28 flex-row items-center gap-4 rounded bg-surface-field p-3 active:opacity-70"
    >
      <View className="w-14 items-center justify-center self-stretch rounded bg-black py-2">
        <Text className="font-sans-bold text-base text-brand">{when.monthShort}</Text>
        <Text className="font-sans-bold text-3xl text-brand">{when.day}</Text>
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={1} className="font-sans-bold text-xl text-white">
          {event.title}
        </Text>
        <Text className="font-sans text-base text-white">{when.timeRange}</Text>
        <Text numberOfLines={1} className="font-sans text-base text-ink-subtle">
          {place}
        </Text>
        {stackBadges && badges}
      </View>

      {!stackBadges && badges}
    </Pressable>
  );
}
