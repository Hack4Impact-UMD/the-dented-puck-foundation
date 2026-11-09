import { Pressable, Text } from 'react-native';
import type { HomeAnnouncement } from '@/types/home';

export function AnnouncementCard({ announcement, onPress }: { announcement: HomeAnnouncement; onPress?: () => void }) {
  const date = announcement.publishedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <Pressable
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${announcement.title}, ${date}. ${announcement.body}`}
      onPress={onPress}
      disabled={!onPress}
      className="gap-2 rounded bg-surface-card p-4"
    >
      <Text className="font-sans-bold text-[22px] leading-7 text-white">{announcement.title}</Text>
      <Text className="font-sans text-lg text-ink-subtle">{date}</Text>
      <Text className="font-sans text-lg leading-7 text-white">{announcement.body}</Text>
    </Pressable>
  );
}
