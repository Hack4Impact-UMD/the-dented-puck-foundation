import { Image, Text, View } from "react-native";
import { useScreenReaderProps, type ScreenReaderStopProps } from "@/components/accessibility";

interface AuthErrorMessageProps extends ScreenReaderStopProps {
  message: string;
}

export function AuthErrorMessage({
  message,
  screenReaderLabel,
  hideFromScreenReader,
  screenReaderOrder,
}: AuthErrorMessageProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="flex-row gap-2">
      <Image
        source={require("@/assets/icons/error.png")}
        style={{ width: 22, height: 22, marginTop: 2 }}
      />
      <Text
        accessibilityRole="alert"
        accessibilityLabel={screenReaderLabel}
        className="flex-1 font-sans text-lg leading-[26px] text-danger-dark"
      >
        {message}
      </Text>
    </View>
  );
}
