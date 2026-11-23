import { Pressable, Text } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';

type Props = ScreenReaderControlProps & {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Square-ish option button laid out in a row (Figma 7311: "8 hours", "1 week", "Until I turn
 * it on"). Wrap several in `<View className="flex-row gap-2">`. Selected: yellow outline.
 */
export function ChoiceButton({
  label,
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
      accessibilityLabel={screenReaderLabel ?? label}
      accessibilityHint={screenReaderHint}
      accessibilityState={{ checked: selected }}
      className={`min-h-[72px] flex-1 items-center justify-center rounded-lg border-2 p-2 active:opacity-80 ${
        selected ? 'border-brand bg-brand-soft-dark' : 'border-line bg-surface-alt-dark'
      }`}
    >
      <Text className="text-center font-sans-bold text-body text-white">{label}</Text>
    </Pressable>
  );
}
