import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { app } from '@/firebase';

export default function HomeScreen() {
  const [status] = useState(() => {
    try {
      return app?.name ? `Connected: ${app.options.projectId || app.name}` : 'Firebase unavailable';
    } catch (err: unknown) {
      return `Firebase status: ${err instanceof Error ? err.message : 'Unavailable'}`;
    }
  });

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
      <Link href="/auth/signup" className="text-sky-400 mt-3">
        Sign up
      </Link>
    </View>
  );
}
