import { useEffect } from 'react';
import { router } from 'expo-router';
import { auth } from '@/firebase';
import CreateAccountForm from '@/components/auth/CreateAccountForm';
export default function CreateAccountScreen() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/auth/login');
    } else if (!user.emailVerified) {
      router.replace('/auth/verify-email');
    }
  }, []);
  return <CreateAccountForm />;
}