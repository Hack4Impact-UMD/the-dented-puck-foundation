import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import TeamHeader from '@/components/team/TeamHeader';

export default function FindTeamScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <TeamHeader
        onBack={() => router.back()}
        onCreate={() => router.push('/tabs/teams/create')}
      />
    </SafeAreaView>
  );
}
