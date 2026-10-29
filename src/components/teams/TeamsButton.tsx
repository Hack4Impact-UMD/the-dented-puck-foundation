import { Pressable, Text } from 'react-native';

interface TeamsButtonProps {
  label: string;
  // Extra context only; screen reader users can turn hints off.
  hint?: string;
  onPress: () => void;
}

export function TeamsButton({ label, hint, onPress }: TeamsButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={hint}
      className="min-h-14 items-center justify-center rounded bg-brand px-4 active:opacity-80"
    >
      <Text className="font-sans-bold text-base text-on-brand">{label}</Text>
    </Pressable>
  );
}
