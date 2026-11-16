import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// Placeholder Home: layout/design TBD. Bell links to Notifications (issue #23).
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-end px-2">
        <Pressable
          onPress={() => router.push('/tabs/home/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          accessibilityHint="Opens your notifications"
          className="h-12 w-12 items-center justify-center active:opacity-70"
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text accessibilityRole="header" className="text-xl text-white">
          Home
        </Text>
      </View>
    </SafeAreaView>
  );
}
