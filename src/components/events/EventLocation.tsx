import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { splitLocation } from './eventFormat';

type Props = ScreenReaderStopProps & { location: string };

export function EventLocation({ location, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const { name, details, spoken } = splitLocation(location);
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? spoken}
      className="gap-1"
    >
      <Text className="font-sans-bold text-h3 text-white">{name}</Text>
      {details.map((line) => (
        <Text key={line} className="font-sans text-lg text-ink-quiet">
          {line}
        </Text>
      ))}
    </View>
  );
}
