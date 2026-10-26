import React from 'react';
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
  const rootViewProps = {
    className: 'flex-1 bg-black',
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

  return React.createElement(
    View,
    rootViewProps,
    React.createElement(
      View,
      { className: 'h-16 flex-row items-center justify-between border-b border-neutral-800 px-2' },
      React.createElement(
        Pressable,
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Back',
          accessibilityHint: isPreview
            ? 'Returns to the home screen'
            : 'Returns to account creation',
          className: 'h-12 w-12 items-center justify-center',
          nativeID: 'verify-email-back',
          onPress: onBack,
        },
        React.createElement(Text, { className: 'text-3xl leading-9 text-white' }, '‹')
      ),
      React.createElement(
        Text,
        {
          accessibilityRole: 'header',
          className: 'text-base font-bold text-white',
          nativeID: 'verify-email-title',
        },
        'Create an account'
      ),
      React.createElement(
        Pressable,
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Close',
          accessibilityHint: isPreview ? 'Returns to the home screen' : 'Returns to log in',
          className: 'h-12 w-12 items-center justify-center',
          nativeID: 'verify-email-close',
          onPress: onClose,
        },
        React.createElement(Text, { className: 'text-3xl leading-9 text-white' }, '×')
      )
    ),
    React.createElement(
      ScrollView,
      {
        className: 'flex-1',
        contentContainerClassName: 'px-4 pb-8 pt-5',
        keyboardShouldPersistTaps: 'handled',
      },
      React.createElement(
        View,
        {
          accessible: true,
          accessibilityRole: 'text',
          accessibilityLabel: `${instructions} ${emailLabel}`,
          className: 'gap-2',
          nativeID: 'verify-email-instructions',
        },
        React.createElement(Text, { className: 'text-base text-white' }, instructions),
        React.createElement(
          View,
          { className: 'min-h-12 justify-center rounded-sm border border-neutral-700 bg-neutral-800 px-3' },
          React.createElement(Text, { className: 'font-semibold text-white' }, emailLabel)
        )
      ),
      message &&
        React.createElement(
          Text,
          {
            accessibilityRole: 'alert',
            accessibilityLiveRegion: 'polite',
            className: `mt-4 text-sm ${
              message.type === 'error' ? 'text-red-400' : 'text-green-400'
            }`,
            nativeID: 'verify-email-feedback',
          },
          message.text
        ),
      React.createElement(
        Pressable,
        {
          accessibilityRole: 'button',
          accessibilityLabel: isResending
            ? 'Sending verification email'
            : 'Resend verification email',
          accessibilityHint: isPreview
            ? 'Unavailable in the visual preview'
            : isLoadingProfile
              ? 'Available after account details finish loading'
              : 'Sends another verification link to this email address',
          // Disable real sending in development previews and until the profile email is validated.
          accessibilityState: {
            disabled: isPreview || isResending || !email || !isProfileEmailValid,
            busy: isResending,
          },
          className: `mt-9 min-h-12 items-center justify-center rounded-sm px-4 ${
            isPreview || isResending || !email || !isProfileEmailValid
              ? 'bg-yellow-300'
              : 'bg-yellow-400'
          }`,
          disabled: isPreview || isResending || !email || !isProfileEmailValid,
          nativeID: 'verify-email-resend',
          onPress: onResend,
        },
        React.createElement(
          Text,
          { className: 'text-center font-bold text-black' },
          isResending ? 'Sending verification email...' : 'Resend verification email'
        )
      ),
      // Firebase's standard verification link doesn't actually enforce the 10 minute expiry, would need to write the backend for this.
      React.createElement(
        Text,
        {
          accessibilityRole: 'text',
          className: 'mt-3 text-center text-sm text-neutral-300',
          nativeID: 'verify-email-expiry',
        },
        'Link expires in 10 minutes.',
      )
    )
  );
}
