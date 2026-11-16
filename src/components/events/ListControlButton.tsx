import type { ComponentRef, Ref } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Props = {
  label: string;
  value: string;
  count?: number; // shown on the button, e.g. "Filter (2)", so sighted users can see a filter is on
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  ref?: Ref<ComponentRef<typeof View>>; // lets the list move screen reader focus back here when its sheet closes
};

// Filter and Sort buttons (6300, annotations 2 and 3): label plus a value such as "None" or "By date".
// Screen readers hear the label and value ("Filter, 2 applied"); the visible count is for sighted users.
export function ListControlButton({ label, value, count, icon, onPress, ref }: Props) {
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      className="min-h-12 flex-row items-center gap-2 rounded border border-brand bg-brand-soft-dark px-3 active:opacity-70"
    >
      <Text className="font-sans-bold text-base text-brand">{count ? `${label} (${count})` : label}</Text>
      <Ionicons name={icon} size={18} color="#FFD101" accessibilityElementsHidden importantForAccessibility="no" />
    </Pressable>
  );
}
