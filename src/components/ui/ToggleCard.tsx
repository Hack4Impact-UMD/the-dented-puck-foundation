import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { Switch } from './Switch';

type Props = ScreenReaderControlProps & {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/**
 * Bordered card with a title, a switch and a description (Figma: "Allow location access").
 * The whole card is one switch for screen readers: it reads the title, the state, then the
 * description as the hint.
 */
export function ToggleCard({
  title,
  description,
  value,
  onValueChange,
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
      onPress={withPressAnnouncement(() => onValueChange(!value), screenReaderPressAnnouncement)}
      accessibilityRole="switch"
      accessibilityLabel={screenReaderLabel ?? title}
      accessibilityHint={screenReaderHint ?? description}
      accessibilityState={{ checked: value }}
      className="gap-3 rounded border-2 border-white bg-surface-field p-[15px] active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-sans-bold text-body text-white">{title}</Text>
        <Switch value={value} />
      </View>
      {description ? <Text className="font-sans text-small text-ink-subtle">{description}</Text> : null}
    </Pressable>
  );
}
