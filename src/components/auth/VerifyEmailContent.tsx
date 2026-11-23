import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import ChevronBackIcon from '@/assets/icons/chevron-back.svg';
import {
  AccessibilityOrder,
  skipFocusProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

/** Spoken text for each stop in `VerifyEmailContent`. */
export type VerifyEmailContentScreenReaderParts = {
  /** Defaults: label "Back", hint "Returns to account creation". */
  back?: ScreenReaderControlText;
  /** Default: "Create an account". */
  title?: ScreenReaderStopText;
  /** Defaults: label "Close", hint "Returns to log in". */
  close?: ScreenReaderControlText;
  /** The instructions and address box, read together. Default: "A verification link has been sent to: {email}". */
  instructions?: ScreenReaderStopText;
  /** The feedback message. Defaults to `message.text`. */
  feedback?: ScreenReaderStopText;
  /** Defaults: label "Resend verification email" ("Sending verification email" while busy), hint "Sends another verification link to this email address". */
  resend?: ScreenReaderControlText;
  /** Default: "Link expires in 10 minutes." */
  expiry?: ScreenReaderStopText;
};

interface VerifyEmailContentProps extends ScreenReaderProps {
  email: string;
  isLoadingUser: boolean;
  isResending: boolean;
  message: { type: 'error' | 'success'; text: string } | null;
  onBack: () => void;
  onClose: () => void;
  onResend: () => void;
  screenReaderParts?: VerifyEmailContentScreenReaderParts;
}

export default function VerifyEmailContent({
  email,
  isLoadingUser: isLoadingProfile,
  isResending,
  message,
  onBack,
  onClose,
  onResend,
  screenReaderParts: parts,
  hideFromScreenReader,
  screenReaderOrder,
}: VerifyEmailContentProps) {
  const instructions = 'A verification link has been sent to:';
  const emailLabel = email || (isLoadingProfile ? 'Loading email address' : 'Email unavailable');
  const isResendDisabled = isResending;
  const readingOrder = [
    'verify-email-back',
    'verify-email-title',
    'verify-email-close',
    'verify-email-instructions',
    ...(message ? ['verify-email-feedback'] : []),
    'verify-email-resend',
    'verify-email-expiry',
  ];

  return (
    <AccessibilityOrder
      order={readingOrder}
      hideFromScreenReader={hideFromScreenReader}
      screenReaderOrder={screenReaderOrder}
      className="flex-1 bg-surface-dark"
    >
      <View className="min-h-[60px] flex-row items-center justify-between border-b border-line-dark px-2">
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          accessibilityRole="button"
          accessibilityLabel={parts?.back?.label ?? 'Back'}
          accessibilityHint={parts?.back?.hint ?? 'Returns to account creation'}
          className="h-12 w-12 items-center justify-center"
          nativeID="verify-email-back"
          onPress={withPressAnnouncement(onBack, parts?.back?.pressAnnouncement)}
        >
          <ChevronBackIcon width={24} height={24} />
        </Pressable>
        <Text
          accessibilityRole="header"
          accessibilityLabel={parts?.title?.label}
          className="font-sans-bold text-h3 text-ink-dark"
          nativeID="verify-email-title"
        >
          Create an account
        </Text>
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          accessibilityRole="button"
          accessibilityLabel={parts?.close?.label ?? 'Close'}
          accessibilityHint={parts?.close?.hint ?? 'Returns to log in'}
          className="h-12 w-12 items-center justify-center"
          nativeID="verify-email-close"
          onPress={withPressAnnouncement(onClose, parts?.close?.pressAnnouncement)}
        >
          <Image source={require('@/assets/icons/close.png')} style={{ width: 24, height: 24 }} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-8 pt-8"
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={parts?.instructions?.label ?? `${instructions} ${emailLabel}`}
          className="gap-4"
          nativeID="verify-email-instructions"
        >
          <Text className="font-sans text-xl leading-7 text-ink-dark">{instructions}</Text>
          <View className="min-h-14 justify-center rounded border border-line-dark bg-surface-well px-4">
            <Text className="font-sans-bold text-lg text-ink-dark">{emailLabel}</Text>
          </View>
        </View>

        {message && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={parts?.feedback?.label}
            className={`font-sans text-lg ${
              message.type === 'error' ? 'text-danger-dark' : 'text-success-dark'
            }`}
            nativeID="verify-email-feedback"
          >
            {message.text}
          </Text>
        )}

        {/* Decorative rule between the address and the button (Figma: 12px above and below). */}
        <View className="py-3">
          <View className="h-px bg-line-dark" />
        </View>

        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          accessibilityRole="button"
          accessibilityLabel={
            parts?.resend?.label ?? (isResending ? 'Sending verification email' : 'Resend verification email')
          }
          accessibilityHint={parts?.resend?.hint ?? 'Sends another verification link to this email address'}
          accessibilityState={{ disabled: isResendDisabled, busy: isResending }}
          className={`min-h-14 items-center justify-center rounded px-4 ${
            isResendDisabled ? 'bg-brand/70' : 'bg-brand'
          }`}
          disabled={isResendDisabled}
          nativeID="verify-email-resend"
          onPress={withPressAnnouncement(onResend, parts?.resend?.pressAnnouncement)}
        >
          <Text className="text-center font-sans-bold text-xl text-on-brand">
            {isResending ? 'Sending verification email...' : 'Resend verification email'}
          </Text>
        </Pressable>

        {/* Firebase's standard verification link doesn't enforce the 10 minute expiry. */}
        <Text
          accessibilityRole="text"
          accessibilityLabel={parts?.expiry?.label}
          className="text-center font-sans text-body text-ink-soft"
          nativeID="verify-email-expiry"
        >
          Link expires in 10 minutes.
        </Text>
      </ScrollView>
    </AccessibilityOrder>
  );
}
