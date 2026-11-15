import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { EventDetails } from '@/components/events/EventDetails';
import { addEventToCalendar } from '@/services/calendarService';
import { getEvent, getTeamByTeamId } from '@/services/eventService';

// Event Details page, opened as /event/<eventId>.
export default function EventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const eventQuery = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
  const event = eventQuery.data;

  // The design shows one team, so the event's first team is used.
  const teamId = event?.teamIds[0];
  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamByTeamId(teamId!),
    enabled: teamId !== undefined,
  });
  const team = teamQuery.data;

  const add_to_calendar_button = () => {
    if (!event) return;
    addEventToCalendar(event).catch((err) => console.error('Failed to open calendar', eventId, err));
  };

  if (eventQuery.isPending || (teamId !== undefined && teamQuery.isPending)) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFD101" accessibilityLabel="Loading event" />
      </View>
    );
  }

  if (!event || !team) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-4">
        <Text accessibilityRole="header" className="text-center text-xl text-white">
          {"Couldn't load this event"}
        </Text>
      </View>
    );
  }

  return <EventDetails event={event} teamName={team.name} onAddToCalendar={add_to_calendar_button} />;
}
