import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text accessibilityRole="header" className="text-xl text-white">
        Home
      </Text>
    </View>
  );
}
