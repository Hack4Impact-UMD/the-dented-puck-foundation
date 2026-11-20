import { ScrollView, View } from 'react-native';
import AppButton from '@/components/team/AppButton';
import type { ReplyGroups } from '@/services/rsvpService';
import { EventWithId } from '@/types';
import { EventDateTime } from '../EventDateTime';
import { EventHeader } from '../EventHeader';
import { EventLocation } from '../EventLocation';
import { CoachNoteCard } from './CoachNoteCard';
import { ReplySummary } from './ReplySummary';

type Props = {
  event: EventWithId;
  teamName: string;
  replies: ReplyGroups | null; // null: replies couldn't load
  onAddToCalendar: () => void;
  onSeeAllReplies: () => void;
  onEditNote: () => void;
};

// 6450 – Event Details (coach and team staff). JSX order is the gold-pin reading order:
// title, team, date and time, location, Add to calendar, replies, note. Edit event is in the header.
export function CoachEventDetails({ event, teamName, replies, onAddToCalendar, onSeeAllReplies, onEditNote }: Props) {
  return (
    <ScrollView className="flex-1 bg-black">
      <EventHeader title={event.title} teamName={teamName} />

      <View className="gap-6 px-4 py-6">
        <View className="items-start gap-4">
          <EventDateTime start={event.startTime} end={event.endTime} />
          <EventLocation location={event.location} />
          <AppButton title="Add to calendar" icon="calendar-outline" onPress={onAddToCalendar} />
        </View>

        <View className="h-px bg-line" />
        <ReplySummary going={replies?.going ?? null} onSeeAll={onSeeAllReplies} />
        <View className="h-px bg-line" />

        <CoachNoteCard notes={event.notes} onEdit={onEditNote} />
      </View>
    </ScrollView>
  );
}
