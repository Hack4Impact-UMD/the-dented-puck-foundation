import { useEffect, useState } from 'react';
import { Button, Platform, Text, View } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase';
import { signInWithGoogle } from '@/services/authService';

export default function LoginScreen() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 p-6 gap-4">
      <Text className="text-2xl font-bold text-white">Log in</Text>
      {user ? (
        <Text className="text-white">
          Signed in as {user.displayName || user.email || 'Google user'}
        </Text>
      ) : (
        <>
          <Button
            title={loading ? 'Signing in...' : 'Sign in with Google'}
            onPress={handleGoogleSignIn}
            disabled={loading || Platform.OS !== 'web'}
          />
          {Platform.OS !== 'web' && (
            <Text className="text-slate-300 text-center">
              Google sign-in is currently available in the web app.
            </Text>
          )}
        </>
      )}
      {error && <Text accessibilityRole="alert" className="text-red-400 text-center">{error}</Text>}
    </View>
  );
}
