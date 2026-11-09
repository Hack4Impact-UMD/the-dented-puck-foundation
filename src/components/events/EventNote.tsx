import { Text, View } from 'react-native';

type Props = { notes?: string };

const LABEL = 'Note from coach';

export function EventNote({ notes }: Props) {
  if (!notes) return null;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${LABEL}. ${notes}`}
      className="gap-2 rounded bg-surface-field p-4"
    >
      <Text className="font-sans-bold text-base text-ink-muted-dark">{LABEL}</Text>
      <Text className="font-sans text-lg text-white">{notes}</Text>
    </View>
  );
}
