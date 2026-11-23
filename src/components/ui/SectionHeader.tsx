import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

const TITLE_STYLE = {
  /** 26/34: Home sections ("Schedule", "Upcoming Events"). */
  large: 'font-sans-bold text-h2 text-white',
  /** 21/30: "Recent", "Replies", "Are you going?". */
  medium: 'font-sans-bold text-h3 text-white',
  /** 18/28 white: channel info ("Notifications", "Players · 15"). */
  small: 'font-sans-bold text-body-lg text-white',
  /** 18/24 grey: list groups in New message and the team switcher ("Coaches and staff"). */
  muted: 'font-sans-bold text-label text-ink-muted-dark',
} as const;

export type SectionHeaderScreenReaderParts = { title?: ScreenReaderStopText; action?: ScreenReaderControlText };

type Props = ScreenReaderProps & {
  title: string;
  size?: keyof typeof TITLE_STYLE;
  /** Underlined link on the right, for example "See all". */
  action?: { label: string; onPress: () => void };
  screenReaderParts?: SectionHeaderScreenReaderParts;
};

/** A section heading, with an optional "See all" style link. Reading order: heading, link. */
export function SectionHeader({ title, size = 'large', action, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="flex-row items-center justify-between gap-4">
      <Text accessibilityRole="header" accessibilityLabel={screenReaderParts?.title?.label} className={`shrink ${TITLE_STYLE[size]}`}>
        {title}
      </Text>
      {action ? (
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(action.onPress, screenReaderParts?.action?.pressAnnouncement)}
          accessibilityRole="button"
          accessibilityLabel={screenReaderParts?.action?.label ?? `${action.label}, ${title}`}
          accessibilityHint={screenReaderParts?.action?.hint}
          className="min-h-12 justify-center active:opacity-70"
        >
          <Text className="font-sans-bold text-body text-white underline">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
