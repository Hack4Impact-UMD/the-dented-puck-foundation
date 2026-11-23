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
import { CountBadge } from './CountBadge';

export type TabStripTab<T extends string> = { value: T; label: string; /** Unread count shown after the label. */ count?: number };

type Props<T extends string> = ScreenReaderProps & {
  tabs: TabStripTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken text per tab, keyed by value. Default label: "{label}" or "{label}, {count} unread". */
  screenReaderParts?: Partial<Record<T, ScreenReaderControlText>>;
};

/**
 * Underlined tabs across the top of a screen (Figma: Chats → Channels / Messages). On the web the
 * strip is one Tab stop: arrow keys move between tabs, and Space or Enter opens the focused one.
 */
export function TabStrip<T extends string>({
  tabs,
  value,
  onChange,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props<T>) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const tabRefs = useRef<(ViewInstance | null)[]>([]);
  const web = Platform.OS === 'web';
  const tabStop = Math.max(0, tabs.findIndex((tab) => tab.value === value));

  const open = (tab: TabStripTab<T>) =>
    withPressAnnouncement(() => onChange(tab.value), screenReaderParts?.[tab.value]?.pressAnnouncement);

  const onKeyDown = (index: number) => (event: KeyDownEvent) => {
    const { key } = event.nativeEvent;
    if (isSpaceKey(key)) {
      event.preventDefault();
      open(tabs[index])?.();
      return;
    }
    const target = arrowKeyTarget(key, index, tabs.length);
    if (target === undefined) return;
    event.preventDefault();
    tabRefs.current[target]?.focus();
  };

  return (
    <View {...screenReaderProps} accessibilityRole="tablist" className="flex-row border-b border-line-faint">
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        const spoken = screenReaderParts?.[tab.value];
        const defaultLabel = tab.count ? `${tab.label}, ${tab.count} unread` : tab.label;
        return (
          <Pressable
            key={tab.value}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            {...(web && { 'aria-selected': selected, tabIndex: index === tabStop ? 0 : -1, onKeyDown: onKeyDown(index) })}
            {...skipFocusProps(hideFromScreenReader)}
            onPress={open(tab)}
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
