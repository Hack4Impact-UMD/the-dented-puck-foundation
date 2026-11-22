import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type PickerRowProps = {
  label: string;
  placeholder: string;
  value?: string;
  hint: string;
  onPress?: () => void;
  disabled?: boolean;
};

// A form row that opens its own picker screen (Figma 6500: Date, Time, Location).
// Label, value and chevron are one focus stop; the visible label and chevron are hidden from screen readers.
export function PickerRow({ label, placeholder, value, hint, onPress, disabled }: PickerRowProps) {
  return (
    <View className="gap-2">
      <Text aria-hidden className="font-sans-bold text-lg leading-[26px] text-white">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ?? 'Not selected' }}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        className="min-h-14 flex-row items-center gap-3 rounded border-2 border-white bg-surface-field p-4 active:opacity-80"
      >
        <Text className={`flex-1 font-sans text-lg ${value ? 'text-white' : 'text-ink-subtle'}`}>{value ?? placeholder}</Text>
        <View aria-hidden>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </View>
      </Pressable>
    </View>
  );
}
