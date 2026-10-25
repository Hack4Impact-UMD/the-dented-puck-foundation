import type { ReactNode, Ref } from "react";
import { Image, Text, TextInput, View, type TextInputProps } from "react-native";

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  helperText?: string;
  // Rendered inside the input on the right, e.g. the Show/Hide password button
  accessory?: ReactNode;
  // Rendered below the error, e.g. "Log in instead"
  children?: ReactNode;
  ref?: Ref<TextInput>;
}

export function AuthTextField({
  label,
  error,
  helperText,
  accessory,
  children,
  ...inputProps
}: AuthTextFieldProps) {
  return (
    <View className="gap-2">
      <Text aria-hidden className="font-sans-bold text-lg leading-[26px] text-white">
        {label}
      </Text>

      <View>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? helperText}
          className={`min-h-14 rounded border-2 bg-surface-field px-4 font-sans text-[18px] text-white ${
            error ? "border-danger-dark" : "border-white"
          } ${accessory ? "pr-20" : ""}`}
          {...inputProps}
        />
        {accessory ? (
          <View className="absolute bottom-0 right-1 top-0 justify-center">{accessory}</View>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row gap-2">
          <Image source={require("@/assets/icons/error.png")} style={{ width: 22, height: 22, marginTop: 2 }} />
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-1 font-sans text-lg leading-[26px] text-danger-dark"
          >
            {error}
          </Text>
        </View>
      ) : null}

      {children}

      {helperText ? (
        <Text className="font-sans text-lg leading-[26px] text-ink-subtle">{helperText}</Text>
      ) : null}
    </View>
  );
}
