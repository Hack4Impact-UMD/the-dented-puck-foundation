import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import {
  NotificationTabs,
  type NotificationTab,
} from '@/components/notifications/NotificationTabs';
import { getNotifications, notificationsKey } from '@/services/notificationService';

export default function NotificationsScreen() {
  const [tab, setTab] = useState<NotificationTab>('unread');
  const listQuery = useQuery({
    queryKey: notificationsKey(),
    queryFn: getNotifications,
  });

  const items = useMemo(() => {
    const all = listQuery.data ?? [];
    return all.filter((item) => (tab === 'unread' ? !item.read : item.read));
  }, [listQuery.data, tab]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <NotificationHeader title="Notifications" onBack={() => (router.canGoBack() ? router.back() : router.replace('/tabs/home'))} />
      <NotificationTabs value={tab} onChange={setTab} />

      {listQuery.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFD101" accessibilityLabel="Loading notifications" />
        </View>
      ) : listQuery.isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-lg text-white">Couldn&apos;t load notifications</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-4 pb-6"
          ListEmptyComponent={
            <Text className="mt-8 text-center font-sans text-base text-ink-muted-dark">
              No {tab} notifications
            </Text>
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() =>
                router.push({
                  pathname: '/tabs/home/notifications/[eventId]',
                  params: { eventId: item.id },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
