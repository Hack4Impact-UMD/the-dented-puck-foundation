import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { app } from '@/firebase';

export default function HomeScreen() {
  const [status, setStatus] = useState('Initializing Firebase...');

  useEffect(() => {
    try {
      if (app?.name) {
        setStatus(`Connected: ${app.options.projectId || app.name}`);
      }
    } catch (err: any) {
      setStatus(`Firebase status: ${err?.message ?? 'Unavailable'}`);
    }
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 p-6">
      <Text className="text-2xl font-bold text-white mb-2">
        The Dented Puck
      </Text>
      <Text className="text-sm text-sky-400 text-center">
        {status}
      </Text>
    </View>
  );
}
