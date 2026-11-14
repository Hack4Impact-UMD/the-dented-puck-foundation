import { Pressable, Text, View } from 'react-native';

import { formatChatTime } from '@/utils/formatChatTime';

export type Conversation = {
  id: string;
  participants: string[];
  isStaff: boolean;
  lastMessage: string;
  updatedAt: number;
  unread: number;
};

// for the chat's avatar logo
function initials(name: string) {
  const words = name.replace(/\./g, '').trim().split(/\s+/);
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
}

// display the rows of messages under "Messages" section tab
export default function MessageRow({ conversation }: { conversation: Conversation }) {
  const { participants, isStaff, lastMessage, updatedAt, unread } = conversation;
  const title = participants.join(', ');
  const time = formatChatTime(updatedAt);
  const hasUnread = unread > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        `${title}, ${time}. ${lastMessage}` + (hasUnread ? `. ${unread} unread` : '')
      }
      onPress={() => {
        // TODO: open the message conversation
      }}
      className="flex-row items-center gap-3.5 border-b border-[#2B2B2B] py-3.5 active:opacity-80"
    >
      {/* chat's avatar logo */}
      <View
        className={`h-[52px] w-[52px] items-center justify-center rounded-full ${
          isStaff ? 'bg-brand' : 'bg-white'
        }`}
      >
        <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
          {initials(participants[0])}
        </Text>
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        {/* message header including chat's participants names (excluding current user) */}
        <View className="flex-row items-start justify-between gap-3">
          <Text numberOfLines={1} className="flex-1 font-sans-bold text-[18px] leading-[26px] text-white">
            {title}
          </Text>
          <Text className="font-sans text-[18px] leading-[26px] text-ink-muted-dark">{time}</Text>
        </View>

        {/* most recent message in the chat */}
        <View className="flex-row items-center justify-between gap-3">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[18px] leading-[26px] ${
              hasUnread ? 'font-sans-bold text-white' : 'font-sans text-ink-muted-dark'
            }`}
          >
            {lastMessage}
          </Text>
          {hasUnread && (
            <View className="min-h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2">
              <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
