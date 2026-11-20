import { ScrollView, Text, View } from 'react-native';
import type { ReplyGroups } from '@/services/rsvpService';
import { REPLY_ORDER, replyHeading } from './replyText';

// 6452 – Replies. Each group title ("8 going") is a heading so screen reader users can jump
// between groups; each name is plain text, one stop each. Empty groups are left out.
export function ReplyList({ replies }: { replies: ReplyGroups }) {
  const groups = REPLY_ORDER.filter((status) => replies[status].length > 0);

  if (!groups.length) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-4">
        <Text accessibilityRole="text" className="text-center font-sans text-xl text-white">
          No replies yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="gap-8 p-4">
      {groups.map((status) => {
        const heading = replyHeading(status, replies[status].length);
        return (
          <View key={status} className="gap-4">
            <Text accessibilityRole="header" accessibilityLabel={heading} className="font-sans-bold text-lg text-white">
              {heading}
            </Text>
            {replies[status].map((name, index) => (
              <Text key={`${name}-${index}`} accessibilityRole="text" accessibilityLabel={name} className="font-sans text-base text-white">
                {name}
              </Text>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
