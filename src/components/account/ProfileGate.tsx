import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';

// Waits for the profile so each form can start with the saved values.
export default function ProfileGate({ children }: { children: (profile: Profile) => ReactNode }) {
  const { data, isError } = useProfile();
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-lg font-sans text-white">Couldn't load your profile. Go back and try again.</Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }
  return <>{children(data)}</>;
}
