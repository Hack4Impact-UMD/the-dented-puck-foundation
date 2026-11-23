import { Pressable, Text, View } from 'react-native';
import { skipFocusProps, useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  notes?: string;
  /** Default "Note from coach" (players). The coach's own view (Figma 6450) says "Note for players". */
  label?: string;
  /** Shows an "Edit" link in the corner (coach view). Spoken "Edit {label}". */
  onEdit?: () => void;
};

export function EventNote({ notes, label = 'Note from coach', onEdit, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  // Nothing renders without a note, so don't take a place in the reading order either.
  const screenReaderProps = useScreenReaderProps({
    hideFromScreenReader,
    screenReaderOrder: notes ? screenReaderOrder : undefined,
  });
  if (!notes) return null;

  if (!onEdit) {
    return (
      <View
        {...screenReaderProps}
        accessible
        accessibilityRole="text"
        accessibilityLabel={screenReaderLabel ?? `${label}. ${notes}`}
        className="gap-2 rounded bg-surface-card p-4"
      >
        <Text className="font-sans-bold text-small text-ink-quiet">{label}</Text>
        <Text className="font-sans text-lg text-white">{notes}</Text>
      </View>
    );
  }

  // Two stops: the note, then its Edit link.
  return (
    <View {...screenReaderProps} className="gap-2 rounded bg-surface-card px-4 pb-4 pt-2">
      <View className="flex-row items-center justify-between">
        <Text aria-hidden className="flex-1 font-sans-bold text-small text-ink-quiet">
          {label}
        </Text>
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label.toLowerCase()}`}
          className="min-h-12 justify-center pl-4 active:opacity-70"
        >
          <Text className="font-sans-bold text-small text-white underline">Edit</Text>
        </Pressable>
      </View>
      <Text accessibilityLabel={screenReaderLabel ?? `${label}. ${notes}`} className="font-sans text-lg text-white">
        {notes}
      </Text>
    </View>
  );
}
