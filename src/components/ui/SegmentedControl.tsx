import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';

export type SegmentedOption<T extends string> = { value: T; label: string };

type Props<T extends string> = ScreenReaderProps & {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken name of the group, for example "Home feed" or "Start time". */
  label: string;
  /**
   * `default`: full width, 56 px segments (Home: For You / Discover).
   * `compact`: 72 × 48 px segments that size to their content (New event: AM / PM).
   */
  size?: 'default' | 'compact';
  /** Spoken text per option, keyed by value. */
  screenReaderParts?: Partial<Record<T, ScreenReaderControlText>>;
};

/** A row of mutually exclusive options; the chosen one is solid yellow. Each option is a radio button. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'default',
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props<T>) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const compact = size === 'compact';

  return (
    <View
      {...screenReaderProps}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={`flex-row rounded-lg bg-surface-field ${compact ? 'self-start p-1' : 'p-[5px]'}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const spoken = screenReaderParts?.[option.value];
        return (
          <Pressable
            key={option.value}
            {...skipFocusProps(hideFromScreenReader)}
            onPress={withPressAnnouncement(() => onChange(option.value), spoken?.pressAnnouncement)}
            accessibilityRole="radio"
            accessibilityLabel={spoken?.label ?? option.label}
            accessibilityHint={spoken?.hint}
            accessibilityState={{ checked: selected, selected }}
            className={`items-center justify-center rounded px-1.5 active:opacity-70 ${compact ? 'h-12 w-[72px]' : 'h-14 flex-1'} ${
              selected ? 'bg-brand' : ''
            }`}
          >
            <Text className={`font-sans-bold text-xl ${selected ? 'text-on-brand' : 'text-brand'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
