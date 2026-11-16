import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TeamHeader from '@/components/team/TeamHeader';

export default function CreateTeamScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <TeamHeader onBack={() => router.back()} onCreate={() => {}} />
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-white text-xl text-center">Create Team</Text>
      </View>
    </SafeAreaView>
  );
}
