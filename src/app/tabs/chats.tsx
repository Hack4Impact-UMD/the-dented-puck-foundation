import { Text, View } from 'react-native';

export default function ChatsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text accessibilityRole="header" className="text-xl text-white">
        Chats
      </Text>
    </View>
  );
}
