import { Text, View } from "react-native";
import ErrorIcon from "@/assets/icons/error.svg";

export function AuthErrorMessage({ message }: { message: string }) {
  return (
    <View className="flex-row gap-2">
      <View aria-hidden className="mt-0.5">
        <ErrorIcon width={22} height={22} />
      </View>
      <Text
        accessibilityRole="alert"
        className="flex-1 font-sans text-lg leading-[26px] text-danger-dark"
      >
        {message}
      </Text>
    </View>
  );
}
