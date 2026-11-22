import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  dimmed?: boolean; // outlined, but stays focusable and reads "dimmed"
  busy?: boolean;
};

// Only used where design shows a disabled state with more than color (email "Next").
export default function PrimaryButton({ label, onPress, dimmed = false, busy = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dimmed || busy, busy }}
      onPress={() => {
        if (!dimmed && !busy) onPress();
      }}
      className={`mt-2 min-h-14 items-center justify-center rounded active:opacity-80 ${
        dimmed ? 'border-2 border-brand' : 'bg-brand'
      }`}
    >
      {busy ? (
        <ActivityIndicator color="#000000" />
      ) : (
        <Text className={`text-xl font-sans-bold ${dimmed ? 'text-brand' : 'text-black'}`}>{label}</Text>
      )}
    </Pressable>
  );
}
