import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { DateTile } from '@/components/ui/DateTile';
import { Tag } from '@/components/ui/Tag';
import { getEventWhen, getInitials, splitLocation } from './eventFormat';

type Props = ScreenReaderControlProps & {
  title: string;
  start: Date;
  end: Date;
  /** "Venue, Street, City, ST"; the card shows the venue and city. */
  location: string;
  teamName: string;
  /** Bottom-right status, for example "Joined" or "Followed". */
  status?: string;
  onPress: () => void;
};

/**
 * Event summary card for lists (Figma 6100 Schedule, 6200 Upcoming Events, 6300 See All,
 * 6900 notification details): date tile, title, time, place, team tag and status.
 * One button that reads "Practice Session, Saturday, November 1, 10 AM to 12 PM, Rink, City, Baltimore Blades, Joined".
 */
export function EventCard({
  title,
  start,
  end,
  location,
  teamName,
  status,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const when = getEventWhen(start, end);
  const place = splitLocation(location);
  const placeLine = [place.name, place.details[place.details.length - 1]?.split(',')[0]].filter(Boolean).join(', ');

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? [title, when.spoken, place.spoken, teamName, status].filter(Boolean).join(', ')}
      accessibilityHint={screenReaderHint}
      className="flex-row items-center gap-[15px] rounded bg-surface-card p-2.5 active:opacity-80"
    >
      <DateTile month={when.monthShort} day={when.day} tone="black" />
      <View className="flex-1 justify-between self-stretch pb-1">
        <View>
          <Text numberOfLines={1} className="font-sans-bold text-h3 text-white">
            {title}
          </Text>
          <Text className="font-sans text-body-lg text-white">{when.timeRange}</Text>
        </View>
        <Text numberOfLines={1} className="font-sans text-[18px] text-ink-quiet">
          {placeLine}
        </Text>
      </View>
      <View className="h-[78px] items-end justify-between">
        <Tag label={getInitials(teamName)} hideFromScreenReader />
        {status ? <Text className="font-sans text-[18px] text-ink-quiet">{status}</Text> : null}
      </View>
    </Pressable>
  );
}
