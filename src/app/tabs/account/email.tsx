import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EditScreenShell from '@/components/account/EditScreenShell';
import FormField from '@/components/account/FormField';
import PrimaryButton from '@/components/account/PrimaryButton';
import { auth } from '@/firebase';
import { announce } from '@/utils/accessibility';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailScreen() {
  const { updated } = useLocalSearchParams<{ updated?: string }>();
  const currentEmail = auth.currentUser?.email ?? '';
  const [newEmail, setNewEmail] = useState('');

  const trimmed = newEmail.trim();
  const looksValid = EMAIL_PATTERN.test(trimmed);
  const isSame = trimmed.toLowerCase() === currentEmail.toLowerCase();
  const valid = looksValid && !isSame;
  const error =
    trimmed && !looksValid ? 'Enter a valid email address' : trimmed && isSame ? 'That is already your email' : undefined;

  // 8144: shown after the new email is verified
  useEffect(() => {
    if (updated === '1') announce(`Email updated to ${currentEmail}`);
  }, [updated, currentEmail]);

  return (
    <EditScreenShell title="Change email">
      <View className="mb-4">
        <Text accessibilityElementsHidden importantForAccessibility="no" className="mb-2 text-lg font-sans-bold text-white">
          Current Email
        </Text>
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Current email, ${currentEmail}`}
          className="min-h-14 justify-center rounded border-2 border-neutral-600 bg-neutral-800 px-4"
        >
          <Text className="text-lg font-sans text-neutral-300">{currentEmail}</Text>
        </View>
      </View>

      <FormField
        label="New Email"
        accessibilityLabel="New email"
        value={newEmail}
        onChangeText={setNewEmail}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
      />

      <PrimaryButton
        label="Next"
        dimmed={!valid}
        onPress={() =>
          router.push({ pathname: '/tabs/account/email-password', params: { newEmail: trimmed } })
        }
      />
    </EditScreenShell>
  );
}
