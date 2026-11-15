import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import AppButton from '@/components/team/AppButton';
import { EventWithId } from '@/types';
import { EventDateTime } from './EventDateTime';
import { EventHeader } from './EventHeader';
import { EventLocation } from './EventLocation';
import { EventNote } from './EventNote';
import { RsvpResponse, RsvpSection } from './RsvpSection';

type Props = {
  event: EventWithId;
  teamName: string;
  onAddToCalendar: () => void;
};

// The body of the Event Details screen; the route supplies the native header (back button + title).
// JSX order is the designer's reading order.
export function EventDetails({ event, teamName, onAddToCalendar }: Props) {
  const [followed, setFollowed] = useState(false);
  const [rsvp, setRsvp] = useState<RsvpResponse | null>(null);

  return (
    <ScrollView className="flex-1 bg-black">
      <EventHeader
        title={event.title}
        teamName={teamName}
        followed={followed}
        onToggleFollow={() => setFollowed((current) => !current)}
      />

      <View className="gap-6 px-4 py-6">
        <View className="items-start gap-4">
          <EventDateTime start={event.startTime} end={event.endTime} />
          <EventLocation location={event.location} />
          <AppButton title="Add to calendar" icon="calendar-outline" onPress={onAddToCalendar} />
        </View>

        <View className="h-px bg-line" />
        <RsvpSection value={rsvp} onChange={setRsvp} />
        <View className="h-px bg-line" />

        <EventNote notes={event.notes} />
      </View>
    </ScrollView>
  );
}
