import { Pressable, ScrollView, Text, View } from 'react-native';

interface VerifyEmailContentProps {
  email: string;
  isPreview: boolean;
  isLoadingProfile: boolean;
  isProfileEmailValid: boolean;
  isResending: boolean;
  message: { type: 'error' | 'success'; text: string } | null;
  onBack: () => void;
  onClose: () => void;
  onResend: () => void;
}

export default function VerifyEmailContent({
  email,
  isPreview,
  isLoadingProfile,
  isProfileEmailValid,
  isResending,
  message,
  onBack,
  onClose,
  onResend,
}: VerifyEmailContentProps) {
  const instructions = 'A verification link has been sent to:';
  const emailLabel = email || (isLoadingProfile ? 'Loading email address' : 'Email unavailable');
  const isResendDisabled = isPreview || isResending || !email || !isProfileEmailValid;
  const rootViewProps = {
    className: 'flex-1 bg-surface-dark',
    experimental_accessibilityOrder: [
      'verify-email-back',
      'verify-email-title',
      'verify-email-close',
      'verify-email-instructions',
      ...(message ? ['verify-email-feedback'] : []),
      'verify-email-resend',
      'verify-email-expiry',
    ],
  };

  return (
    <View {...rootViewProps}>
      <View className="h-16 flex-row items-center justify-between border-b border-line px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint={isPreview ? 'Returns to the home screen' : 'Returns to account creation'}
          className="h-12 w-12 items-center justify-center"
          nativeID="verify-email-back"
          onPress={onBack}
        >
          <Text className="text-3xl leading-9 text-ink-dark">‹</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-ink-dark"
          nativeID="verify-email-title"
        >
          Create an account
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessibilityHint={isPreview ? 'Returns to the home screen' : 'Returns to log in'}
          className="h-12 w-12 items-center justify-center"
          nativeID="verify-email-close"
          onPress={onClose}
        >
          <Text className="text-3xl leading-9 text-ink-dark">×</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${instructions} ${emailLabel}`}
          className="gap-2"
          nativeID="verify-email-instructions"
        >
          <Text className="text-2xl text-ink-dark">{instructions}</Text>
          <View className="min-h-14 justify-center rounded-sm border border-line bg-surface-alt-dark px-3">
            <Text className="text-xl font-semibold text-ink-dark">{emailLabel}</Text>
          </View>
        </View>

        {message && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className={`mt-4 text-lg ${
              message.type === 'error' ? 'text-danger-dark' : 'text-success-dark'
            }`}
            nativeID="verify-email-feedback"
          >
            {message.text}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isResending ? 'Sending verification email' : 'Resend verification email'}
          accessibilityHint={
            isPreview
              ? 'Unavailable in the visual preview'
              : isLoadingProfile
                ? 'Available after account details finish loading'
                : 'Sends another verification link to this email address'
          }
          accessibilityState={{ disabled: isResendDisabled, busy: isResending }}
          className={`mt-9 min-h-14 items-center justify-center rounded-sm px-4 ${
            isResendDisabled ? 'bg-brand/70' : 'bg-brand'
          }`}
          disabled={isResendDisabled}
          nativeID="verify-email-resend"
          onPress={onResend}
        >
          <Text className="text-center text-2xl font-bold text-on-brand">
            {isResending ? 'Sending verification email...' : 'Resend verification email'}
          </Text>
        </Pressable>

        {/* Firebase's standard verification link doesn't enforce the 10 minute expiry. */}
        <Text
          accessibilityRole="text"
          className="mt-3 text-center text-xl text-ink-muted-dark"
          nativeID="verify-email-expiry"
        >
          Link expires in 10 minutes.
        </Text>
      </ScrollView>
    </View>
  );
}
