import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const [status, setStatus] = useState('Initializing Firebase...');

  useEffect(() => {
    let isMounted = true;

    import('@/firebase')
      .then(({ app }) => {
        if (isMounted) {
          setStatus(`Connected: ${app.options.projectId || app.name}`);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setStatus(`Firebase status: ${err instanceof Error ? err.message : 'Unavailable'}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 p-6">
      <Text className="text-2xl font-bold text-white mb-2">
        The Dented Puck
      </Text>
      <Text className="text-sm text-sky-400 text-center">
        {status}
      </Text>
      <Link href="/auth/login" className="text-sky-400 mt-6">
        Log in
      </Link>
      {/* Development-only shortcut for viewing the verification UI without signing in. */}
      {__DEV__ && (
        <>
          <Link
            href="/auth/verify-email?preview=true"
            className="mt-6 rounded bg-yellow-400 px-4 py-3 font-bold text-black"
          >
            Preview email verification
          </Link>
        </>
      )}
    </View>
  );
}
