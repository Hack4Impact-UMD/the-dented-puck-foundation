import { Image, Text, View } from "react-native";

export function AuthErrorMessage({ message }: { message: string }) {
  return (
    <View className="flex-row gap-2">
      <Image
        source={require("@/assets/icons/error.png")}
        style={{ width: 22, height: 22, marginTop: 2 }}
      />
      <Text
        accessibilityRole="alert"
        className="flex-1 font-sans text-lg leading-[26px] text-danger-dark"
      >
        {message}
      </Text>
    </View>
  );
}
