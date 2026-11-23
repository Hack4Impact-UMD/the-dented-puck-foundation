import { Pressable, Text } from 'react-native';

// 6450, annotation 1: visible "Edit", read as "Edit event". Editing an event isn't part of this
// task yet, so the button is shown but unavailable (same pattern as Home's unavailable See all).
export function EditEventButton() {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityLabel="Edit event"
      accessibilityState={{ disabled: true }}
      accessibilityHint="Editing events is not available yet"
      hitSlop={8}
      className="min-h-11 justify-center opacity-50"
    >
      <Text className="font-sans-bold text-lg text-white">Edit</Text>
    </Pressable>
  );
}
