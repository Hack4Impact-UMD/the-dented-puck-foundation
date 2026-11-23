import { useState, type Ref } from "react";
import {
  Pressable,
  Text,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import {
  skipFocusProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from "@/components/accessibility";
import { AuthTextField, type AuthTextFieldScreenReaderParts } from "./AuthTextField";

/** Spoken text for each stop in a `PasswordField`. */
export type PasswordFieldScreenReaderParts = AuthTextFieldScreenReaderParts & {
  /** The toggle while the password is masked. Default label: "Show". */
  showButton?: ScreenReaderControlText;
  /** The toggle while the password is visible. Default label: "Hide". */
  hideButton?: ScreenReaderControlText;
};

interface PasswordFieldProps extends TextInputProps, ScreenReaderProps {
  label: string;
  error?: string | null;
  helperText?: string;
  /** @deprecated Use `screenReaderParts.field.hint`. Still works; `screenReaderParts` wins if both are set. */
  hint?: string;
  ref?: Ref<TextInputInstance>;
  screenReaderParts?: PasswordFieldScreenReaderParts;
}

export function PasswordField({ value, screenReaderParts, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const toggleText = visible ? screenReaderParts?.hideButton : screenReaderParts?.showButton;

  // Toggle only appears once there is password typed in
  const toggle = value ? (
    <Pressable
      onPress={withPressAnnouncement(() => setVisible((v) => !v), toggleText?.pressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={toggleText?.label ?? (visible ? "Hide" : "Show")}
      accessibilityHint={toggleText?.hint}
      className="min-h-12 justify-center px-3 active:opacity-70"
      {...skipFocusProps(props.hideFromScreenReader)}
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
      screenReaderParts={screenReaderParts}
      {...props}
    />
  );
}
