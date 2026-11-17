import { Pressable, Text, View } from 'react-native';
import { getInitials } from '@/components/events/eventFormat';
import { formatNotificationListDate } from '@/components/notifications/notificationFormat';
import { EventNotification } from '@/services/notificationService';

type Props = {
  notification: EventNotification;
  onPress: () => void;
};

export function NotificationCard({ notification, onPress }: Props) {
  const dateLabel = formatNotificationListDate(notification.startTime);
  const initials = notification.teamName ? getInitials(notification.teamName) : null;
  const a11yLabel = [notification.title, notification.notes, dateLabel, notification.read ? 'Read' : 'Unread']
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Opens the event details"
      className={`rounded-xl bg-surface-alt-dark p-4 active:opacity-80 ${
        notification.read ? '' : 'border border-brand'
      }`}
    >
      <View className="flex-row gap-3">
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-12 w-12 items-center justify-center rounded-full bg-brand"
        >
          <Text className="font-sans-bold text-base text-on-brand">{initials ?? 'E'}</Text>
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="shrink font-sans-bold text-lg text-white">{notification.title}</Text>
            <Text className="font-sans text-sm text-ink-muted-dark">{dateLabel}</Text>
          </View>
          {notification.teamName ? (
            <Text className="font-sans text-base text-white">{notification.teamName}</Text>
          ) : null}
          {notification.notes ? (
            <Text className="font-sans text-base text-white">{notification.notes}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
