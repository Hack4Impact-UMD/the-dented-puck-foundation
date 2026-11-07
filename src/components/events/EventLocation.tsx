import { Text, View } from 'react-native';
import { splitLocation } from './eventFormat';

type Props = { location: string };

export function EventLocation({ location }: Props) {
  const { name, details, spoken } = splitLocation(location);

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={spoken} className="gap-1">
      <Text className="font-sans-bold text-xl text-white">{name}</Text>
      {details.map((line) => (
        <Text key={line} className="font-sans text-lg text-ink-subtle">
          {line}
        </Text>
      ))}
    </View>
  );
}
