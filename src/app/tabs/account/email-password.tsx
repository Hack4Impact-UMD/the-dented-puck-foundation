import { useRef, useState } from 'react';
import { Pressable, Text, View, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EditScreenShell from '@/components/account/EditScreenShell';
import { AuthButton } from '@/components/auth/AuthButton';
import { PasswordField } from '@/components/auth/PasswordField';
import { auth } from '@/firebase';
import { startEmailChange } from '@/services/accountService';
import { getAuthFormError } from '@/services/authService';
import { announce } from '@/utils/accessibility';

export default function EnterPasswordScreen() {
  const { newEmail } = useLocalSearchParams<{ newEmail: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  const onNext = async () => {
    if (busy) return;
    if (!password) {
      setError('Enter your password');
      announce('Enter your password');
      passwordRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await startEmailChange(newEmail, password); // re-authenticates, then emails the new address
      router.push({ pathname: '/tabs/account/email-verify', params: { newEmail } });
    } catch (e) {
      const { message } = getAuthFormError(e);
      setError(message);
      announce(message);
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const onForgot = () =>
    router.push({
      pathname: '/auth/forgot-password',
      params: { email: auth.currentUser?.email ?? '' },
    });

  return (
    <EditScreenShell title="Enter password" left="back">
      <PasswordField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(null);
        }}
        error={error}
        placeholder="Enter Password"
        autoComplete="password"
        textContentType="password"
        returnKeyType="next"
        onSubmitEditing={onNext}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Forgot password?"
        onPress={onForgot}
        className="min-h-12 justify-center"
      >
        <Text className="font-sans text-base text-white underline">Forgot password?</Text>
      </Pressable>

      <View className="mt-2">
        <AuthButton label="Next" loadingLabel="Checking…" loading={busy} onPress={onNext} />
      </View>
    </EditScreenShell>
  );
}
