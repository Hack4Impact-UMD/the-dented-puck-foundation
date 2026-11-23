import { Image, Text, View } from "react-native";
import { useScreenReaderProps, type ScreenReaderStopProps } from "@/components/accessibility";

interface AuthErrorBannerProps extends ScreenReaderStopProps {
  title: string;
  message: string;
}

// Form-level error above the fields, e.g. a wrong email or password (Figma 5120).
// Field-level errors use AuthErrorMessage under the field instead.
export function AuthErrorBanner({ title, message, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: AuthErrorBannerProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={screenReaderLabel ?? `${title} ${message}`}
      className="gap-2.5 rounded border-2 border-danger-dark bg-surface-field p-4"
    >
      <View className="flex-row gap-2">
        <Image
          source={require("@/assets/icons/error.png")}
          style={{ width: 22, height: 22, marginTop: 2 }}
        />
        <Text className="flex-1 font-sans text-lg text-danger-dark">{title}</Text>
      </View>
      <Text className="font-sans text-lg text-white">{message}</Text>
    </View>
  );
}
