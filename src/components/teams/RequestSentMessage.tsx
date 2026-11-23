import { Text, View } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

// Shared by the visible text and accessibilityLabel so the two can't drift apart.
const TITLE = 'Request sent!';
const BODY = "The coach will review your request. You'll get a notification once it's approved.";

/** Spoken text for each stop in a `RequestSentMessage`. */
export type RequestSentMessageScreenReaderParts = {
  /** Default: "Request sent!". */
  title?: ScreenReaderStopText;
  /** Default: the visible explanation. */
  body?: ScreenReaderStopText;
};

type RequestSentMessageProps = ScreenReaderProps & {
  screenReaderParts?: RequestSentMessageScreenReaderParts;
};

export function RequestSentMessage({ screenReaderParts, hideFromScreenReader, screenReaderOrder }: RequestSentMessageProps = {}) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="items-center gap-3 pt-9">
      <Text
        accessibilityLabel={screenReaderParts?.title?.label ?? TITLE}
        accessibilityRole="header"
        className="text-center font-sans-bold text-h2 text-white"
      >
        {TITLE}
      </Text>
      <Text
        accessibilityLabel={screenReaderParts?.body?.label ?? BODY}
        accessibilityRole="text"
        className="max-w-[322px] text-center font-sans text-body text-ink-soft"
      >
        {BODY}
      </Text>
    </View>
  );
}
