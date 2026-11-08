import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { auth } from '@/firebase';
import { resendVerificationEmail } from '@/services/authService';

type ScreenMessage = { type: 'error' | 'success'; text: string };

export default function VerifyEmailScreen() {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [email, setEmail] = useState(() => auth.currentUser?.email ?? '');
  const [isLoadingProfile, setIsLoadingProfile] = useState(!auth.currentUser);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<ScreenMessage | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return;
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }
      setUser(currentUser);
      setEmail(currentUser.email ?? '');
      setIsLoadingProfile(false);
    });

    async function checkEmailVerified() {
      if (isNavigatingRef.current) return;
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        await currentUser.reload();
        if (currentUser.emailVerified && isMounted && !isNavigatingRef.current) {
          isNavigatingRef.current = true;
          router.replace('/auth/create-account');
        }
      } catch (err) {
        isNavigatingRef.current = false;
        console.error('Error checking verification status:', err);
      }
    }

    checkEmailVerified();

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkEmailVerified();
      }
    });

    const intervalId = setInterval(checkEmailVerified, 3500);

    return () => {
      isMounted = false;
      unsubscribeAuth();
      appStateSub.remove();
      clearInterval(intervalId);
    };
  }, []);

  async function handleResend() {
    const targetUser = user || auth.currentUser;
    if (!targetUser) {
      return;
    }

    setIsResending(true);
    setMessage(null);

    try {
      await resendVerificationEmail(targetUser);
      setMessage({
        type: 'success',
        text: 'A new verification email has been sent.',
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      setMessage({
        type: 'error',
        text: `Unable to resend the verification email. ${detail}`,
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <VerifyEmailContent
        email={email}
        isLoadingUser={isLoadingProfile}
        isResending={isResending}
        message={message}
        onBack={() => router.replace('/auth/signup')}
        onClose={() => router.replace('/auth/login')}
        onResend={handleResend}
      />
    </SafeAreaView>
  );
}