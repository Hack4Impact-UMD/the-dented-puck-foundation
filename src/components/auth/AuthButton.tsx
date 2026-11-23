import { Image, Pressable, Text, type ImageSourcePropType } from "react-native";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from "@/components/accessibility";

interface AuthButtonProps extends ScreenReaderControlProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  icon?: ImageSourcePropType;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  /** @deprecated Use `screenReaderLabel`. Still works; `screenReaderLabel` wins if both are set. */
  accessibilityLabel?: string;
}

export function AuthButton({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  loadingLabel,
  accessibilityLabel,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: AuthButtonProps) {
  const inactive = disabled || loading;
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? accessibilityLabel}
      accessibilityHint={screenReaderHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`min-h-14 flex-row items-center justify-center gap-3 rounded px-1.5 active:opacity-80 ${
        variant === "primary" ? "bg-brand" : "bg-white"
      } ${inactive ? "opacity-60" : ""}`}
    >
      {icon ? <Image source={icon} style={{ width: 22, height: 22 }} /> : null}
      <Text className="text-center font-sans-bold text-xl text-black">
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}
