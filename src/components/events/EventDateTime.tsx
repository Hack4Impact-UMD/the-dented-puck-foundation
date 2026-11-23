import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { DateTile } from '@/components/ui/DateTile';
import { getEventWhen } from './eventFormat';

type Props = ScreenReaderStopProps & { start: Date; end: Date };

export function EventDateTime({ start, end, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const when = getEventWhen(start, end);
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  // One stop that reads the whole block; the date tile is not read on its own.
  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? when.spoken}
      className="flex-row items-center gap-4"
    >
      <DateTile month={when.monthShort} day={when.day} />
      <View className="shrink gap-1">
        <Text className="font-sans-bold text-h3 text-white">{when.weekday}</Text>
        <Text className="font-sans text-lg text-white">{when.timeRange}</Text>
      </View>
    </View>
  );
}
