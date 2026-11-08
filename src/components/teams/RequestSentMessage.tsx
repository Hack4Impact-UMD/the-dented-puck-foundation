import { Text, View } from 'react-native';

// Shared by the visible text and accessibilityLabel so the two can't drift apart.
const TITLE = 'Request sent!';
const BODY = "The coach will review your request. You'll get a notification once it's approved.";

export function RequestSentMessage() {
  return (
    <View className="items-center gap-3 pt-9">
      <Text
        accessibilityLabel={TITLE}
        accessibilityRole="header"
        className="text-center font-sans-bold text-2xl leading-[34px] text-white"
      >
        {TITLE}
      </Text>
      <Text
        accessibilityLabel={BODY}
        accessibilityRole="text"
        className="max-w-[322px] text-center font-sans text-lg leading-[26px] text-[#D9D9D9]"
      >
        {BODY}
      </Text>
    </View>
  );
}
