import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { auth } from '@/firebase';
import { getUserProfile, resendVerificationEmail } from '@/services/authService';

type ScreenMessage = { type: 'error' | 'success'; text: string };

export default function VerifyEmailScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfileEmailValid, setIsProfileEmailValid] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<ScreenMessage | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      setUser(currentUser);
      setEmail(currentUser.email ?? '');
      setIsLoadingProfile(true);
      setIsProfileEmailValid(false);
      setMessage(null);

      try {
        const profile = await getUserProfile(currentUser.uid);
        if (
          !currentUser.email ||
          profile.email.trim().toLowerCase() !== currentUser.email.trim().toLowerCase()
        ) {
          throw new Error('The account email does not match the saved user profile.');
        }
        if (isMounted) {
          setIsProfileEmailValid(true);
        }
      } catch (error) {
        if (isMounted) {
          const detail = error instanceof Error ? error.message : 'Unknown error.';
          setMessage({
            type: 'error',
            text: `Unable to load your account details. ${detail}`,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function handleResend() {
    if (!user) {
      return;
    }

    setIsResending(true);
    setMessage(null);

    try {
      await resendVerificationEmail();
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
        isLoadingProfile={isLoadingProfile}
        isProfileEmailValid={isProfileEmailValid}
        isResending={isResending}
        message={message}
        onBack={() => router.replace('/auth/signup')}
        onClose={() => router.replace('/auth/login')}
        onResend={handleResend}
      />
    </SafeAreaView>
  );
}