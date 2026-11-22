import { useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import EditScreenShell from '@/components/account/EditScreenShell';
import { AuthButton } from '@/components/auth/AuthButton';
import { auth } from '@/firebase';
import { errorCode, isEmailChangeComplete, resendEmailChange } from '@/services/accountService';
import { getAuthFormError } from '@/services/authService';
import { announce } from '@/utils/accessibility';

export default function VerifyNewEmailScreen() {
  const { newEmail } = useLocalSearchParams<{ newEmail: string }>();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const finished = useRef(false);

  // Watch for the user clicking the link in their inbox.
  useEffect(() => {
    const check = async () => {
      if (finished.current) return;
      try {
        if (await isEmailChangeComplete(newEmail)) {
          finished.current = true;
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          router.dismissAll();
          router.push({ pathname: '/tabs/account/email', params: { updated: '1' } });
        }
      } catch (e) {
        // Firebase revokes the session when the email changes, so reload() can fail like this.
        if (errorCode(e) === 'auth/user-token-expired') {
          finished.current = true;
          announce('Email updated. Please sign in again.');
          await signOut(auth);
          router.replace('/auth/login');
        }
      }
    };
    const id = setInterval(check, 5000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [newEmail, queryClient]);

  const onResend = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      await resendEmailChange(newEmail);
      setMessage('Verification email sent.');
      announce('Verification email sent');
    } catch (e) {
      setMessage(getAuthFormError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <EditScreenShell title="Verify new email" left="back">
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`A verification link has been sent to ${newEmail}`}
      >
        <Text className="mb-2 text-base font-sans text-white">A verification link has been sent to:</Text>
        <View className="mb-6 min-h-12 justify-center rounded-sm bg-neutral-800 px-3">
          <Text className="text-base font-sans-bold text-white">{newEmail}</Text>
        </View>
      </View>

      <AuthButton label="Resend verification email" loadingLabel="Sending…" loading={busy} onPress={onResend} />
      {message ? (
        <Text accessibilityRole="alert" className="mt-3 text-center text-base font-sans text-white">
          {message}
        </Text>
      ) : null}
      <Text className="mt-4 text-center text-base font-sans text-white">Link expires in 10 minutes.</Text>
    </EditScreenShell>
  );
}
