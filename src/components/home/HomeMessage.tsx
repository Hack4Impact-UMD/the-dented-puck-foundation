import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useHomeAnnouncement } from '@/hooks/useHomeAnnouncement';

interface Props {
  title: string;
  message?: string;
  loading?: boolean;
  action?: string;
  onAction?: () => void;
  announce?: boolean;
}

export function HomeMessage({ title, message, loading, action, onAction, announce = true }: Props) {
  useHomeAnnouncement(announce ? [title, message].filter(Boolean).join('. ') : null);
  return (
    <View className="gap-3 py-6" accessibilityLiveRegion={Platform.OS === 'web' && announce ? 'polite' : undefined}>
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
