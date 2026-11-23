import type { ComponentProps } from "react";
import { Text } from "react-native";
import { useScreenReaderProps, type ScreenReaderStopProps } from "@/components/accessibility";

// One variant per style in the Figma Style Guide; sizes live in tailwind.config.js (`fontSize`).
const typography = {
  display: "font-sans-bold text-display text-white",
  h1: "font-sans-bold text-h1 text-white",
  h2: "font-sans-bold text-h2 text-white",
  h3: "font-sans-bold text-h3 text-white",
  bodyLarge: "font-sans text-body-lg text-ink-subtle",
  body: "font-sans text-body text-ink-subtle",
  label: "font-sans-bold text-label text-white",
  caption: "font-sans text-caption text-ink-subtle",
  small: "font-sans text-small text-ink-subtle",
};

type AppTextProps = ComponentProps<typeof Text> &
  ScreenReaderStopProps & { variant?: keyof typeof typography };

export function AppText({
  variant = "body",
  className = "",
  screenReaderLabel,
  hideFromScreenReader,
  screenReaderOrder,
  ...props
}: AppTextProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder }, props.nativeID);
  return (
    <Text
      {...props}
      {...screenReaderProps}
      accessibilityLabel={screenReaderLabel ?? props.accessibilityLabel}
      className={`${typography[variant]} ${className}`}
    />
  );
}
