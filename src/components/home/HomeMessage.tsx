import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useHomeAnnouncement } from '@/hooks/useHomeAnnouncement';

interface Props {
  title: string;
  message?: string;
  loading?: boolean;
  action?: string;
  onAction?: () => void;
}

export function HomeMessage({ title, message, loading, action, onAction }: Props) {
  useHomeAnnouncement([title, message].filter(Boolean).join('. '));
  return (
    <View className="gap-3 py-6" accessibilityLiveRegion={Platform.OS === 'web' ? 'polite' : undefined}>
      {loading && <ActivityIndicator color="#FFD101" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />}
      <Text accessibilityRole={loading ? undefined : 'header'} className="font-sans-bold text-xl text-white">{title}</Text>
      {message && <Text className="font-sans text-lg leading-7 text-ink-muted-dark">{message}</Text>}
      {action && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} className="min-h-12 self-start justify-center rounded border border-brand px-5 py-2 active:opacity-70">
          <Text className="font-sans-bold text-lg text-brand">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
