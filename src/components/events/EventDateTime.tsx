import { Text, View } from 'react-native';
import { getEventWhen } from './eventFormat';

type Props = { start: Date; end: Date };

export function EventDateTime({ start, end }: Props) {
  const when = getEventWhen(start, end);

  // One stop that reads the whole block; the date tile is not read on its own.
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={when.spoken}
      className="flex-row items-center gap-4"
    >
      <View className="w-14 items-center rounded bg-surface-field py-2">
        <Text className="font-sans-bold text-base text-brand">{when.monthShort}</Text>
        <Text className="font-sans-bold text-3xl text-brand">{when.day}</Text>
      </View>
      <View className="shrink gap-1">
        <Text className="font-sans-bold text-xl text-white">{when.weekday}</Text>
        <Text className="font-sans text-lg text-white">{when.timeRange}</Text>
      </View>
    </View>
  );
}
