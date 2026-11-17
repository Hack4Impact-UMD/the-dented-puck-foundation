import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '@/services/notificationService';

// Placeholder Home: layout/design TBD. Bell links to Notifications (issue #23).
export default function HomeScreen() {
  // Same query key as the Notifications screen, so they share one cached result.
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  const unreadCount = (data ?? []).filter((item) => !item.read).length;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-end px-2">
        <Pressable
          onPress={() => router.push('/tabs/home/notifications')}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unreadCount} unread`}
          accessibilityHint="Opens your notifications"
          className="h-12 w-12 items-center justify-center active:opacity-70"
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            // Yellow badge with the unread count
            <View className="absolute right-1 top-1 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#FFD100] px-1">
              <Text className="text-[11px] font-bold text-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
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
