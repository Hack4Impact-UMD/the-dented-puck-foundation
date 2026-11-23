import { useRef } from 'react';
import { Platform, Pressable, Text, View, type KeyDownEvent, type ViewInstance } from 'react-native';
import {
  arrowKeyTarget,
  isSpaceKey,
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

/**
 * A row of mutually exclusive options; the chosen one is solid yellow. Each option is a radio button.
 * On the web the group is one Tab stop: arrow keys move to and select the next option, Space selects.
 */
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
  const optionRefs = useRef<(ViewInstance | null)[]>([]);
  const compact = size === 'compact';
  const web = Platform.OS === 'web';
  const tabStop = Math.max(0, options.findIndex((option) => option.value === value));

  const choose = (option: SegmentedOption<T>) =>
    withPressAnnouncement(() => onChange(option.value), screenReaderParts?.[option.value]?.pressAnnouncement);

  const onKeyDown = (index: number) => (event: KeyDownEvent) => {
    const { key } = event.nativeEvent;
    if (isSpaceKey(key)) {
      event.preventDefault();
      choose(options[index])?.();
      return;
    }
    const target = arrowKeyTarget(key, index, options.length);
    if (target === undefined) return;
    event.preventDefault();
    choose(options[target])?.();
    optionRefs.current[target]?.focus();
  };

  return (
    <View
      {...screenReaderProps}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={`flex-row rounded-lg bg-surface-field ${compact ? 'self-start p-1' : 'p-[5px]'}`}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const spoken = screenReaderParts?.[option.value];
        return (
          <Pressable
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            {...(web && { 'aria-checked': selected, tabIndex: index === tabStop ? 0 : -1, onKeyDown: onKeyDown(index) })}
            {...skipFocusProps(hideFromScreenReader)}
            onPress={choose(option)}
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
