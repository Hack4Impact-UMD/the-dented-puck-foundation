import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@/components/team/AppButton';
import { RequestSentMessage } from '@/components/teams/RequestSentMessage';
import { SuccessBadge } from '@/components/teams/SuccessBadge';

export default function RequestSentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black px-4 pb-11" style={{ paddingTop: insets.top + 84 }}>
      <View className="items-center">
        <SuccessBadge />
        <RequestSentMessage />
      </View>
      <View className="flex-1 justify-end">
        <AppButton
          title="Go to teams"
          variant="secondary"
          accessibilityHint="Returns to the Teams tab"
          onPress={() => router.navigate('/tabs/teams')}
        />
      </View>
    </View>
  );
}
