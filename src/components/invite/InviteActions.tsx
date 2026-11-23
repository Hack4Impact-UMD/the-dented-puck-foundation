import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';

/** Spoken text for each stop in `InviteActions`. */
export type InviteActionsScreenReaderParts = {
  /** Default label: "Create account". */
  createAccount?: ScreenReaderControlText;
  /** Default label: "Log in". */
  logIn?: ScreenReaderControlText;
};

interface InviteActionsProps extends ScreenReaderProps {
  onCreateAccount: () => void;
  onLogIn: () => void;
  screenReaderParts?: InviteActionsScreenReaderParts;
}

export default function InviteActions({
  onCreateAccount,
  onLogIn,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: InviteActionsProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const { createAccount, logIn } = screenReaderParts ?? {};

  return (
    <View {...screenReaderProps} className="mt-12 w-full gap-4">
      <Pressable
        {...skipFocusProps(hideFromScreenReader)}
        accessibilityRole="button"
        accessibilityLabel={createAccount?.label ?? 'Create account'}
        accessibilityHint={createAccount?.hint}
        onPress={withPressAnnouncement(onCreateAccount, createAccount?.pressAnnouncement)}
        className="min-h-14 w-full items-center justify-center rounded border-2 border-brand bg-brand px-4 py-3 active:opacity-80"
      >
        <Text className="text-center font-['AtkinsonHyperlegibleBold'] text-[20px] text-on-brand">Create account</Text>
      </Pressable>
      <Pressable
        {...skipFocusProps(hideFromScreenReader)}
        accessibilityRole="button"
        accessibilityLabel={logIn?.label ?? 'Log in'}
        accessibilityHint={logIn?.hint}
        onPress={withPressAnnouncement(onLogIn, logIn?.pressAnnouncement)}
        className="min-h-14 w-full items-center justify-center rounded border-2 border-brand bg-brand-soft-dark px-4 py-3 active:opacity-80"
      >
        <Text className="text-center font-['AtkinsonHyperlegibleBold'] text-[20px] text-brand">Log in</Text>
      </Pressable>
    </View>
  );
}
