import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { CountBadge } from './CountBadge';

export type TabStripTab<T extends string> = { value: T; label: string; /** Unread count shown after the label. */ count?: number };

type Props<T extends string> = ScreenReaderProps & {
  tabs: TabStripTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken text per tab, keyed by value. Default label: "{label}" or "{label}, {count} unread". */
  screenReaderParts?: Partial<Record<T, ScreenReaderControlText>>;
};

/** Underlined tabs across the top of a screen (Figma: Chats → Channels / Messages). */
export function TabStrip<T extends string>({
  tabs,
  value,
  onChange,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props<T>) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} accessibilityRole="tablist" className="flex-row border-b border-line-faint">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        const spoken = screenReaderParts?.[tab.value];
        const defaultLabel = tab.count ? `${tab.label}, ${tab.count} unread` : tab.label;
        return (
          <Pressable
            key={tab.value}
            {...skipFocusProps(hideFromScreenReader)}
            onPress={withPressAnnouncement(() => onChange(tab.value), spoken?.pressAnnouncement)}
            accessibilityRole="tab"
            accessibilityLabel={spoken?.label ?? defaultLabel}
            accessibilityHint={spoken?.hint}
            accessibilityState={{ selected }}
            className={`min-h-[52px] flex-1 flex-row items-center justify-center gap-2 border-b-4 py-2.5 active:opacity-70 ${
              selected ? 'border-brand' : 'border-transparent'
            }`}
          >
            <Text className={`text-body ${selected ? 'font-sans-bold text-white' : 'font-sans text-ink-muted-dark'}`}>{tab.label}</Text>
            {tab.count ? <CountBadge count={tab.count} hideFromScreenReader /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
