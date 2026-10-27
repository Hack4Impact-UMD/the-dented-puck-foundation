import { Text, View } from "react-native";

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-px flex-1 bg-line-dark" />
      <Text className="font-sans text-lg text-ink-subtle">or</Text>
      <View className="h-px flex-1 bg-line-dark" />
    </View>
  );
}
