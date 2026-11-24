import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { NEARBY_RADIUS_KM } from '@/utils/homeLocation';
import { requestDiscoveryLocation } from '@/services/discoveryLocationService';
import { HomeStatusText } from '@/components/home/HomeStatusText';

export function DiscoveryLocationControl() {
  const { state, setDiscoveryLocation } = useHomeDashboard();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  useFocusEffect(useCallback(() => () => {
    ++generation.current;
    setPending(false);
  }, []));
  async function useDeviceLocation() {
    if (pending) return;
    const request = ++generation.current;
    setPending(true);
    setError(null);
    try {
      const value = await requestDiscoveryLocation();
      if (request === generation.current) setDiscoveryLocation(value);
    } catch (failure) {
      if (request === generation.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to find your location. Please try again.');
      }
    } finally { if (request === generation.current) setPending(false); }
  }
  const location = state.viewer?.discoveryLocation;
  return <View className="gap-2">
    <HomeStatusText announceOnMount={false} className="font-sans text-base leading-6 text-ink-subtle">
      {location ? `Within ${NEARBY_RADIUS_KM} km of ${location.label}` : 'Use your device location to find nearby events and teams.'}
    </HomeStatusText>
    <View className="flex-row flex-wrap gap-x-5 gap-y-1">
    <Pressable accessibilityRole="button" accessibilityLabel="Use my location for nearby events and teams" accessibilityState={{ disabled: pending, busy: pending }}
      disabled={pending} onPress={useDeviceLocation} className="min-h-12 flex-row items-center gap-2 py-2">
      {pending && <ActivityIndicator color="#FFD101" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />}
      <Text className="font-sans-bold text-lg text-brand underline">{pending ? 'Finding location…' : 'Use my location'}</Text>
    </Pressable>
    </View>
    {error && <HomeStatusText className="font-sans text-base leading-6 text-danger-dark">{error}</HomeStatusText>}

  </View>;
}
