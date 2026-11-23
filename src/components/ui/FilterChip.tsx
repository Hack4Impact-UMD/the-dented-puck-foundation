import type { ComponentType } from 'react';
import { Pressable, Text } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { colors } from './tokens';

type Props = ScreenReaderControlProps & {
  label: string;
  onPress: () => void;
  /** Solid yellow when selected (Unread / Read); outlined otherwise (Filter, Sort). */
  selected?: boolean;
  /** Shown after the label, for example `filter.svg` or `expand-more.svg`. */
  icon?: ComponentType<SvgProps>;
};

/**
 * Small outlined button for filters and toggles above a list (Figma: Filter, Sort, Unread, Read).
 * It is 35 px tall, so a hit slop brings the touch target to 48 px.
 */
export function FilterChip({
  label,
  onPress,
  selected = false,
  icon: Icon,
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
      hitSlop={{ top: 7, bottom: 7 }}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? label}
      accessibilityHint={screenReaderHint}
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-2.5 self-start rounded border border-brand px-3 py-[5px] active:opacity-70 ${
        selected ? 'bg-brand' : 'bg-brand-soft-dark'
      }`}
    >
      <Text className={`font-sans-bold text-label ${selected ? 'text-on-brand' : 'text-brand'}`}>{label}</Text>
      {Icon ? <Icon width={24} height={24} color={selected ? colors.black : colors.brand} /> : null}
    </Pressable>
  );
}
