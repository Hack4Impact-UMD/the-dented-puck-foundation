import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RequestSentMessage } from '@/components/teams/RequestSentMessage';
import { SuccessBadge } from '@/components/teams/SuccessBadge';
import { TeamsButton } from '@/components/teams/TeamsButton';

export default function RequestSentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black px-4 pb-11" style={{ paddingTop: insets.top + 84 }}>
      <View className="items-center">
        <SuccessBadge />
        <RequestSentMessage />
      </View>
      <View className="flex-1 justify-end">
        <TeamsButton
          label="Go to teams"
          hint="Returns to the Teams tab"
          onPress={() => router.navigate('/tabs/teams')}
        />
      </View>
    </View>
  );
}
