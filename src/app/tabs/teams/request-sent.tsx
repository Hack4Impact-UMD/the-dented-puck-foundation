import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@/components/team/AppButton';
import { RequestSentMessage } from '@/components/teams/RequestSentMessage';
import { SuccessBadge } from '@/components/teams/SuccessBadge';

export default function RequestSentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerClassName="flex-grow px-4 pb-11"
      contentContainerStyle={{ paddingTop: insets.top + 84 }}
    >
      <View className="items-center">
        <SuccessBadge />
        <RequestSentMessage />
      </View>
      <View className="flex-1 justify-end pt-8">
        <AppButton
          title="Go to teams"
          variant="secondary"
          accessibilityHint="Returns to the Teams tab"
          onPress={() => router.navigate('/tabs/teams')}
        />
      </View>
    </ScrollView>
  );
}
