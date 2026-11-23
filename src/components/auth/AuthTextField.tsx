import type { ReactNode, Ref } from "react";
import { Text, TextInput, View, type TextInputProps, type TextInputInstance } from "react-native";
import {
  skipFocusProps,
  useScreenReaderProps,
  useSkipSubtreeFocusProps,
  type ScreenReaderFieldText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from "@/components/accessibility";
import { PLACEHOLDER_COLOR } from "@/components/ui/tokens";
import { AuthErrorMessage } from "./AuthErrorMessage";

/** Spoken text for each stop in an `AuthTextField`. */
export type AuthTextFieldScreenReaderParts = {
  /** The input. Defaults: label = `label`; hint = the error, if any. A custom hint is read after the error. */
  field?: ScreenReaderFieldText;
  /** The error message under the input. Defaults to `error`. */
  error?: ScreenReaderStopText;
  /** The gray helper text. Defaults to `helperText`. */
  helperText?: ScreenReaderStopText;
};

interface AuthTextFieldProps extends TextInputProps, ScreenReaderProps {
  label: string;
  error?: string | null;
  helperText?: string;
  /**
   * @deprecated Use `screenReaderParts.field.hint`. Still works; `screenReaderParts` wins if both are set.
   * Read after the error, if there is one.
   */
  hint?: string;
  // Rendered inside the input on the right, e.g. the Show/Hide password button
  accessory?: ReactNode;
  // Rendered below the error, e.g. "Log in instead"
  children?: ReactNode;
  ref?: Ref<TextInputInstance>;
  screenReaderParts?: AuthTextFieldScreenReaderParts;
}

export function AuthTextField({
  label,
  error,
  helperText,
  hint,
  accessory,
  children,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
  readOnly: readOnlyProp,
  ...inputProps
}: AuthTextFieldProps) {
  const readOnly = readOnlyProp || inputProps.editable === false;
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  // `accessory` and `children` can hold controls (Show/Hide, "Log in instead").
  const subtreeFocusProps = useSkipSubtreeFocusProps(hideFromScreenReader);
  const spokenHint = [error, screenReaderParts?.field?.hint ?? hint].filter(Boolean).join(" ") || undefined;

  return (
    <View {...screenReaderProps} {...subtreeFocusProps} className="gap-2">
      <Text aria-hidden className="font-sans-bold text-lg leading-[26px] text-white">
        {label}
      </Text>

      <View>
        <TextInput
          accessibilityLabel={screenReaderParts?.field?.label ?? label}
          accessibilityHint={spokenHint}
          placeholderTextColor={PLACEHOLDER_COLOR}
          // Figma: read-only fields (2400 Email, 8140 Current Email) lose the white outline;
          // multi-line fields (6500 Note for players) are 140 px tall with the text at the top.
          textAlignVertical={inputProps.multiline ? "top" : undefined}
          className={`rounded px-4 font-sans text-[18px] text-white ${
            inputProps.multiline ? "min-h-[140px] py-4" : "min-h-14"
          } ${
            readOnly
              ? "border border-line-dark bg-surface-well"
              : `border-2 bg-surface-field ${error ? "border-danger-dark" : "border-white"}`
          } ${accessory ? "pr-20" : ""}`}
          {...skipFocusProps(hideFromScreenReader)}
          {...inputProps}
          readOnly={readOnly}
        />
        {accessory ? (
          <View className="absolute bottom-0 right-1 top-0 justify-center">{accessory}</View>
        ) : null}
      </View>

      {error ? <AuthErrorMessage message={error} screenReaderLabel={screenReaderParts?.error?.label} /> : null}

      {children}

      {helperText ? (
        <Text
          accessibilityLabel={screenReaderParts?.helperText?.label}
          className="font-sans text-lg leading-[26px] text-ink-subtle"
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
