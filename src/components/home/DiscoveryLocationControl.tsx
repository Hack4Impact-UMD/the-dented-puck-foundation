import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { demoLocations } from '../../../sandbox/fixtures.mjs';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { NEARBY_RADIUS_KM } from '@/utils/homeLocation';
import { requestDiscoveryLocation } from '@/services/discoveryLocationService';
import { HomeStatusText } from '@/components/home/HomeStatusText';

export function DiscoveryLocationControl() {
  const { state, setDiscoveryLocation } = useHomeDashboard();
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const changeButton = useRef<ComponentRef<typeof View>>(null);
  const focusFrame = useRef<number | null>(null);
  useFocusEffect(useCallback(() => () => {
    ++generation.current;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    setPending(false);
  }, []));
  function chooseCity(city: (typeof demoLocations)[number]) {
    ++generation.current;
    setPending(false);
    setError(null);
    setChoosing(false);
    setDiscoveryLocation({ ...city, source: 'manual' });
    // The chosen row is removed. Return focus to the control that opened it.
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      if (!changeButton.current) return;
      if (Platform.OS === 'web') changeButton.current.focus();
      else AccessibilityInfo.sendAccessibilityEvent(changeButton.current, 'focus');
    });
  }
  async function useDeviceLocation() {
    if (pending) return;
    const request = ++generation.current;
    setPending(true);
    setError(null);
    try {
      const value = await requestDiscoveryLocation();
      if (request === generation.current) { setChoosing(false); setDiscoveryLocation(value); }
    } catch (failure) {
      if (request === generation.current) {
        setError(failure instanceof Error ? failure.message : 'Unable to find your location. Choose a city instead.');
        setChoosing(true);
      }
    } finally { if (request === generation.current) setPending(false); }
  }
  const location = state.viewer?.discoveryLocation;
  return <View className="gap-2">
    <HomeStatusText announceOnMount={false} className="font-sans text-base leading-6 text-ink-subtle">
      {location ? `Within ${NEARBY_RADIUS_KM} km of ${location.label}${location.source === 'demo' ? ' (demo location)' : ''}` : 'Choose a location to find nearby events and teams.'}
    </HomeStatusText>
    <View className="flex-row flex-wrap gap-x-5 gap-y-1">
    <Pressable accessibilityRole="button" accessibilityLabel="Use my location for nearby events and teams" accessibilityState={{ disabled: pending, busy: pending }}
      disabled={pending} onPress={useDeviceLocation} className="min-h-12 flex-row items-center gap-2 py-2">
      {pending && <ActivityIndicator color="#FFD101" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />}
      <Text className="font-sans-bold text-lg text-brand underline">{pending ? 'Finding location…' : 'Use my location'}</Text>
    </Pressable>
    <Pressable ref={changeButton} accessibilityRole="button" accessibilityLabel="Change discovery location" accessibilityState={{ expanded: choosing }}
      onPress={() => setChoosing(!choosing)} className="min-h-12 justify-center self-start py-2">
      <Text className="font-sans-bold text-lg text-brand underline">Change location</Text>
    </Pressable>
    </View>
    {error && <HomeStatusText className="font-sans text-base leading-6 text-danger-dark">{error}</HomeStatusText>}
    {choosing && <View className="gap-2">
      {demoLocations.map((city) => <Pressable key={city.label} accessibilityRole="button" accessibilityLabel={`Use ${city.label} for discovery`}
        accessibilityState={{ selected: city.label === location?.label }} onPress={() => chooseCity(city)}
        className="min-h-12 justify-center rounded border border-line-dark px-3 py-2">
        <Text className="font-sans text-lg text-white">{city.label}</Text>
      </Pressable>)}
    </View>}
  </View>;
}
