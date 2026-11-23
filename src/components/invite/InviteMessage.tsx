import { Text, View } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

/** Spoken text for each stop in an `InviteMessage`. */
export type InviteMessageScreenReaderParts = {
  /** The headline. Defaults to the visible text. */
  heading?: ScreenReaderStopText;
  /** "Create an account or log in to continue". */
  body?: ScreenReaderStopText;
};

type InviteMessageProps = ScreenReaderProps & {
  teamName: string;
  screenReaderParts?: InviteMessageScreenReaderParts;
};

export default function InviteMessage({ teamName, screenReaderParts, hideFromScreenReader, screenReaderOrder }: InviteMessageProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="w-full items-center">
      <Text
        accessibilityRole="header"
        accessibilityLabel={screenReaderParts?.heading?.label}
        className="mt-8 w-full text-center font-['AtkinsonHyperlegibleBold'] text-[32px] leading-[40px] text-white"
      >
        {'You have been invited to\njoin the\n'}{teamName}
      </Text>
      <Text
        accessibilityLabel={screenReaderParts?.body?.label}
        className="mt-4 max-w-[300px] px-[19px] text-center font-['AtkinsonHyperlegibleRegular'] text-xl leading-7 text-ink-soft"
      >
        Create an account or log in to continue
      </Text>
    </View>
  );
}
