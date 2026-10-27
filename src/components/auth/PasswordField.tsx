import { useState, type Ref } from "react";
import {
  Pressable,
  Text,
  type TextInput,
  type TextInputProps,
} from "react-native";
import { AuthTextField } from "./AuthTextField";

interface PasswordFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  helperText?: string;
  ref?: Ref<TextInput>;
}

export function PasswordField({ value, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  // Toggle only appears once there is password typed in
  const toggle = value ? (
    <Pressable
      onPress={() => setVisible((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={visible ? "Hide" : "Show"}
      className="min-h-12 justify-center px-3 active:opacity-70"
    >
      <Text className="font-sans-bold text-lg text-white underline">
        {visible ? "Hide" : "Show"}
      </Text>
    </Pressable>
  ) : null;

  return (
    <AuthTextField
      value={value}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      accessory={toggle}
      {...props}
    />
  );
}
