import { useEffect, useRef, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import EditScreenShell from '@/components/account/EditScreenShell';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { announce } from '@/utils/accessibility';

const DESCRIPTION = "We'll use your location to show you teams and events near you.";
const WARNING = 'Turning off location access will disallow viewing or discovering events nearby.';

export default function EditLocationScreen() {
  return <ProfileGate>{(profile) => <LocationForm profile={profile} />}</ProfileGate>;
}

function LocationForm({ profile }: { profile: Profile }) {
  const [enabled, setEnabled] = useState(profile.allowLocation ?? false);
  const { save, isSaving, saveError } = useSaveProfile('Location access saved');

  // Announce the warning when it appears (not when the screen first opens).
  // The delay lets the switch's new state finish speaking first.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (!enabled) {
      const timer = setTimeout(() => announce(WARNING), 700);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [enabled]);

  return (
    <EditScreenShell title="Change access">
      {/* The whole card is one switch for screen readers; the inner Switch is hidden. */}
      <Pressable
        accessible
        accessibilityRole="switch"
        accessibilityLabel="Allow location access"
        accessibilityHint={DESCRIPTION}
        accessibilityState={{ checked: enabled }}
        onPress={() => setEnabled((v) => !v)}
        className="mb-4 rounded-md border border-neutral-500 bg-neutral-800 p-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-base font-sans-bold text-white">Allow location access</Text>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
            <Switch value={enabled} trackColor={{ false: '#6B7280', true: '#F8D348' }} thumbColor="#000000" />
          </View>
        </View>
        <Text className="mt-2 text-sm font-sans text-neutral-300">{DESCRIPTION}</Text>
      </Pressable>

      {!enabled ? (
        <View accessible accessibilityRole="text" accessibilityLabel={WARNING} className="mb-4 flex-row items-start">
          {/* the icon is decorative, so it is hidden from screen readers */}
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="mr-2 pt-0.5">
            <CircleAlert color="#F87171" size={18} />
          </View>
          <Text className="flex-1 text-base font-sans text-red-400">{WARNING}</Text>
        </View>
      ) : null}

      <SaveButton onPress={() => save({ allowLocation: enabled })} saving={isSaving} error={saveError} />
    </EditScreenShell>
  );
}
