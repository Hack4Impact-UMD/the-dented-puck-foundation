import { Pressable, Text } from "react-native";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from "@/components/accessibility";

interface AuthLinkButtonProps extends ScreenReaderControlProps {
  label: string;
  onPress: () => void;
  /** Figma sets "Forgot password?" in regular weight and "Join now" / "Back to Log in" in bold. Default `bold`. */
  weight?: "bold" | "regular";
  /** @deprecated Use `weight` (`bold={false}` is `weight="regular"`). Still works; `weight` wins if both are set. */
  bold?: boolean;
  /** `center` for a link on its own line at the bottom of a screen ("Back to Log in"). Default `start`. */
  align?: "start" | "center";
}

export function AuthLinkButton({
  label,
  onPress,
  weight: weightProp,
  bold,
  align = "start",
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: AuthLinkButtonProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const weight = weightProp ?? (bold === false ? "regular" : "bold");

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel}
      accessibilityHint={screenReaderHint}
      className={`min-h-12 justify-center active:opacity-70 ${align === "center" ? "self-center" : "self-start"}`}
    >
      <Text className={`${weight === "bold" ? "font-sans-bold" : "font-sans"} text-lg leading-[26px] text-white underline`}>
        {label}
      </Text>
    </Pressable>
  );
}
