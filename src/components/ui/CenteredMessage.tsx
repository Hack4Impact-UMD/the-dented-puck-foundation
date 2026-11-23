import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

export type CenteredMessageScreenReaderParts = { title?: ScreenReaderStopText; message?: ScreenReaderStopText };

type Props = ScreenReaderProps & {
  title: string;
  message?: string;
  /** Shown above the title, for example `<SuccessBadge />`. */
  badge?: ReactNode;
  /** Shown under the message, for example an `AuthButton`. */
  children?: ReactNode;
  screenReaderParts?: CenteredMessageScreenReaderParts;
};

/**
 * Centered title and message for confirmations and empty states: "Password updated",
 * "Team request sent!", "You haven't joined a team yet". Reading order: title, message, children.
 */
export function CenteredMessage({ title, message, badge, children, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="w-full items-center">
      {badge ? <View className="mb-9">{badge}</View> : null}
      <Text accessibilityRole="header" accessibilityLabel={screenReaderParts?.title?.label} className="text-center font-sans-bold text-h2 text-white">
        {title}
      </Text>
      {message ? (
        <Text accessibilityLabel={screenReaderParts?.message?.label} className="mt-3 max-w-[340px] text-center font-sans text-body text-ink-soft">
          {message}
        </Text>
      ) : null}
      {children ? <View className="mt-4 w-full">{children}</View> : null}
    </View>
  );
}
