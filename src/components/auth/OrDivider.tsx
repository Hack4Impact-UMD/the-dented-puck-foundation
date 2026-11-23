import { Text, View } from "react-native";
import { useScreenReaderProps, type ScreenReaderStopProps } from "@/components/accessibility";

export function OrDivider({ screenReaderLabel, hideFromScreenReader, screenReaderOrder }: ScreenReaderStopProps = {}) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="flex-row items-center gap-4">
      <View className="h-px flex-1 bg-line-dark" />
      <Text accessibilityLabel={screenReaderLabel} className="font-sans text-lg text-ink-subtle">or</Text>
      <View className="h-px flex-1 bg-line-dark" />
    </View>
  );
}
