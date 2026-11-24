import { Text, View } from "react-native";
import ErrorIcon from "@/assets/icons/error.svg";

interface AuthAlertProps {
  title: string;
  message: string;
}

// Boxed error alert
export function AuthAlert({ title, message }: AuthAlertProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${title} ${message}`}
      accessibilityLiveRegion="assertive"
      className="gap-2.5 rounded border-2 border-danger-dark bg-surface-field p-4"
    >
      <View className="flex-row gap-2">
        <View aria-hidden className="mt-0.5">
          <ErrorIcon width={22} height={22} />
        </View>
        <Text className="flex-1 font-sans text-lg text-danger-dark">
          {title}
        </Text>
      </View>
      <Text className="font-sans text-lg text-white">{message}</Text>
    </View>
  );
}
