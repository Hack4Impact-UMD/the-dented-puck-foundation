import { createElement, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
const VerifyEmailContent = require('@/components/auth/VerifyEmailContent').default;

type ScreenMessage = { type: 'error' | 'success'; text: string };

export default function VerifyEmailScreen() {
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  // Require both the preview query and a development build so this bypass cannot run in production.
  const isPreview = __DEV__ && preview === 'true';
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfileEmailValid, setIsProfileEmailValid] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<ScreenMessage | null>(null);

  useEffect(() => {
    if (isPreview) {
      // Sample-only state lets the screen render without Firebase Auth or a Firestore profile.
      setEmail('jordan.lee@gmail.com');
      setIsLoadingProfile(false);
      setIsProfileEmailValid(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    import('@/firebase')
      .then(({ auth }) => {
        return import('firebase/auth').then(({ onAuthStateChanged }) => {
          if (!isMounted) {
            return;
          }

          unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
              const { getUserProfile } = await import('@/services/authService');
              const profile = await getUserProfile(currentUser.uid);
              if (
                !currentUser.email ||
                profile.email.trim().toLowerCase() !== currentUser.email.trim().toLowerCase()
              ) {
                throw new Error('The account email does not match the saved user profile.');
              }
              setIsProfileEmailValid(true);
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
        });
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const detail = error instanceof Error ? error.message : 'Unknown error.';
          setMessage({
            type: 'error',
            text: `Unable to initialize your account. ${detail}`,
          });
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [isPreview]);

  async function handleResend() {
    // Preview mode is visual only: never call the live email action from it.
    if (isPreview) {
      return;
    }
    if (!user) {
      return;
    }

    setIsResending(true);
    setMessage(null);

    try {
      const { resendVerificationEmail } = await import('@/services/authService');
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

  return createElement(
    SafeAreaView,
    { className: 'flex-1 bg-black', edges: ['top', 'bottom'] },
    createElement(VerifyEmailContent, {
      email,
      isPreview,
      isLoadingProfile,
      isProfileEmailValid,
      isResending,
      message,
      onBack: () => router.replace(isPreview ? '/' : '/auth/signup'),
      onClose: () => router.replace(isPreview ? '/' : '/auth/login'),
      onResend: handleResend,
    }),
  );
}