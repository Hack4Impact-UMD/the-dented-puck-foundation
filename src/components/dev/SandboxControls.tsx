import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

export function SandboxControls() {
  const { exitPreview, resetPreviewFollows, source, state } = useHomeDashboard();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'sign-out' | 'reset' | null>(null);
  async function leave() {
    if (busy) return;
    setBusy('sign-out');
    setError(null);
    try {
      await exitPreview();
      router.replace('/tabs/home');
    } catch {
      setError('Could not sign out. Try again.');
    } finally {
      setBusy(null);
    }
  }
  async function reset() {
    if (busy || state.refreshing) return;
    setBusy('reset');
    setError(null);
    try { await resetPreviewFollows(); }
    catch { setError('Could not reset fake follows. Try again.'); }
    finally { setBusy(null); }
  }
  return <View className="border-b border-line-dark px-4">
    <View className="flex-row flex-wrap items-center justify-between gap-x-3">
      <Text className="font-sans text-sm text-brand">SANDBOX · Fake events</Text>
      {__DEV__ && source.resetPreviewFollows && state.viewer && <Pressable accessibilityRole="button"
        accessibilityLabel="Reset fake follows to restore the default sample teams"
        disabled={!!busy || state.refreshing} accessibilityState={{ disabled: !!busy || state.refreshing, busy: busy === 'reset' }}
        onPress={reset} className="min-h-11 justify-center py-2">
        <Text className="font-sans-bold text-sm text-white underline">{busy === 'reset' ? 'Resetting…' : 'Reset fake follows'}</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" disabled={!!busy} accessibilityState={{ disabled: !!busy }} onPress={leave} className="min-h-11 justify-center py-2">
        <Text className="font-sans-bold text-sm text-white underline">Dev sign out</Text>
      </Pressable>
    </View>
    {error && <Text accessibilityRole="alert" className="font-sans text-sm text-red-400">{error}</Text>}
  </View>;
}
