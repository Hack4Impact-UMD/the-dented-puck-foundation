import { Image, Pressable, Text, type ImageSourcePropType } from "react-native";

interface AuthButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  icon?: ImageSourcePropType;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export function AuthButton({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  loadingLabel,
}: AuthButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
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
