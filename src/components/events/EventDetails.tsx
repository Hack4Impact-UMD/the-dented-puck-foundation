import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CalendarIcon from '@/assets/icons/calendar.svg';
import { EventWithId } from '@/types';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { EventDateTime } from './EventDateTime';
import { EventHeader, type EventHeaderScreenReaderParts } from './EventHeader';
import { EventLocation } from './EventLocation';
import { EventNote } from './EventNote';
import { RsvpResponse, RsvpSection, type RsvpSectionScreenReaderParts } from './RsvpSection';

/** Spoken text for each stop in `EventDetails`. Nested entries are passed to that component. */
export type EventDetailsScreenReaderParts = {
  header?: EventHeaderScreenReaderParts;
  dateTime?: ScreenReaderStopText;
  location?: ScreenReaderStopText;
  /** The Add to calendar link. Default label: "Add to calendar". */
  addToCalendar?: ScreenReaderControlText;
  rsvp?: RsvpSectionScreenReaderParts;
  note?: ScreenReaderStopText;
};

type Props = ScreenReaderProps & {
  event: EventWithId;
  teamName: string;
  onAddToCalendar: () => void;
  screenReaderParts?: EventDetailsScreenReaderParts;
};

// The body of the Event Details screen; the route supplies the native header (back button + title).
// JSX order is the designer's reading order.
export function EventDetails({
  event,
  teamName,
  onAddToCalendar,
  screenReaderParts: parts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const [followed, setFollowed] = useState(false);
  const [rsvp, setRsvp] = useState<RsvpResponse | null>(null);
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  // Passed down so the controls inside also leave the web Tab order when this is hidden.
  const hidden = hideFromScreenReader;

  return (
    <ScrollView {...screenReaderProps} className="flex-1 bg-black">
      <EventHeader
        title={event.title}
        teamName={teamName}
        followed={followed}
        onToggleFollow={() => setFollowed((current) => !current)}
        screenReaderParts={parts?.header}
        hideFromScreenReader={hidden}
      />

      <View className="gap-8 px-4 pb-10 pt-8">
        <View className="items-start gap-4">
          <EventDateTime
            start={event.startTime}
            end={event.endTime}
            screenReaderLabel={parts?.dateTime?.label}
            hideFromScreenReader={hidden}
          />
          <EventLocation location={event.location} screenReaderLabel={parts?.location?.label} hideFromScreenReader={hidden} />
          {/* Figma's "Add to calendar" is a small underlined link (16.5 / 24), not a full button. */}
          <Pressable
            {...skipFocusProps(hidden)}
            onPress={withPressAnnouncement(onAddToCalendar, parts?.addToCalendar?.pressAnnouncement)}
            accessibilityRole="button"
            accessibilityLabel={parts?.addToCalendar?.label ?? 'Add to calendar'}
            accessibilityHint={parts?.addToCalendar?.hint}
            className="min-h-12 flex-row items-center gap-2 active:opacity-70"
          >
            <CalendarIcon width={24} height={24} />
            <Text className="font-sans-bold text-small text-white underline">Add to calendar</Text>
          </Pressable>
        </View>

        <View className="h-px bg-line" />
        <RsvpSection value={rsvp} onChange={setRsvp} screenReaderParts={parts?.rsvp} hideFromScreenReader={hidden} />
        <View className="h-px bg-line" />

        <EventNote notes={event.notes} screenReaderLabel={parts?.note?.label} hideFromScreenReader={hidden} />
      </View>
    </ScrollView>
  );
}
