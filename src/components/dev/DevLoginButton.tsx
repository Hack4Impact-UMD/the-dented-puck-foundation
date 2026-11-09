import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

export function DevLoginButton() {
  const { enterPreview } = useHomeDashboard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!__DEV__) return null;

  async function login() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try { await enterPreview(); }
    catch { setError('Could not open the demo. Please try again.'); }
    finally { setBusy(false); }
  }

  return <View className="gap-3 py-2">
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fake login, preview sample events"
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={login}
      className="min-h-14 items-center justify-center rounded bg-brand px-4 py-3 active:opacity-70"
    >
      <Text className="font-sans-bold text-xl text-black">{busy ? 'Opening demo…' : 'Fake login (dev)'}</Text>
    </Pressable>
    {error && <Text accessibilityRole="alert" className="font-sans text-lg text-red-400">{error}</Text>}
  </View>;
}
