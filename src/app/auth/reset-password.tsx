import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Text, type TextInputInstance } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  getAuthFormError,
  resetPassword,
  verifyResetLink,
} from "@/services/authService";
import { PASSWORD_REQUIREMENT, validatePassword } from "@/utils/validation";

const LINK_INVALID_MESSAGE = "This link has expired or was already used.";

// Opened from the reset email link
export default function ResetPasswordScreen() {
  const { oobCode = "" } = useLocalSearchParams<{ oobCode?: string }>();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!oobCode);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  // Gets the email for "Choose a new password for …" and catches expired links
  useEffect(() => {
    if (!oobCode) return;
    verifyResetLink(oobCode)
      .then(setAccountEmail)
      .catch((err) => {
        if (getAuthFormError(err).field === "link") setLinkInvalid(true);
      });
  }, [oobCode]);

  useEffect(() => {
    if (linkInvalid)
      AccessibilityInfo.announceForAccessibility(LINK_INVALID_MESSAGE);
  }, [linkInvalid]);

  async function handleSave() {
    if (saving) return;
    setFormError(null);

    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      AccessibilityInfo.announceForAccessibility(error);
      passwordRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      await resetPassword(oobCode, password);
      router.replace("/auth/password-updated");
    } catch (err) {
      const { field, message } = getAuthFormError(err);
      if (field === "link") {
        setLinkInvalid(true);
      } else {
        setFormError(message);
        AccessibilityInfo.announceForAccessibility(message);
      }
    } finally {
      setSaving(false);
    }
  }

  const close = () => router.dismissTo("/auth/login");

  if (linkInvalid) {
    return (
      <AuthScreen title="New password" onClose={close}>
        <AuthErrorMessage message={LINK_INVALID_MESSAGE} />
        <AuthButton
          label="Send a new link"
          onPress={() => router.replace("/auth/forgot-password")}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="New password" onClose={close}>
      <Text className="font-sans text-lg text-white">
        {accountEmail
          ? `Choose a new password for ${accountEmail}.`
          : "Choose a new password."}
      </Text>

      <PasswordField
        ref={passwordRef}
        label="New Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(null);
        }}
        error={passwordError}
        hint={PASSWORD_REQUIREMENT}
        helperText={PASSWORD_REQUIREMENT}
        // Figma 5400 wants iOS to suggest a strong password here
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      {formError ? <AuthErrorMessage message={formError} /> : null}

      <AuthButton
        label="Save new password"
        loadingLabel="Saving…"
        loading={saving}
        onPress={handleSave}
      />
    </AuthScreen>
  );
}
