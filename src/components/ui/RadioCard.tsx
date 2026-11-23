import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { SelectionIndicator } from './SelectionIndicator';

type Props = ScreenReaderControlProps & {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * One choice in a list of options, with a title and a description (Figma 7311: "All messages",
 * "Only @mentions", "Nothing"). Put a `SectionHeader` (size `small`) above the group as its label.
 */
export function RadioCard({
  title,
  description,
  selected,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="radio"
      accessibilityLabel={screenReaderLabel ?? title}
      accessibilityHint={screenReaderHint ?? description}
      accessibilityState={{ checked: selected }}
      className={`min-h-[72px] flex-row items-center gap-3.5 rounded-lg border-2 py-2.5 pl-4 pr-4 active:opacity-80 ${
        selected ? 'border-brand bg-brand-soft-dark' : 'border-line-faint bg-surface-card'
      }`}
    >
      <SelectionIndicator selected={selected} />
      <View className="flex-1">
        <Text className="font-sans-bold text-body text-white">{title}</Text>
        {description ? <Text className="font-sans text-body text-ink-muted-dark">{description}</Text> : null}
      </View>
    </Pressable>
  );
}
