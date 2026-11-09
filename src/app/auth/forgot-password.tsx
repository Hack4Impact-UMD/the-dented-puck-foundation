import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  Text,
  View,
  type TextInputInstance,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthLinkButton } from "@/components/auth/AuthLinkButton";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { getAuthFormError, sendPasswordReset } from "@/services/authService";
import { validateEmail } from "@/utils/validation";

export default function ForgotPasswordScreen() {
  // Carried over information from login
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);

  function showEmailError(message: string) {
    setEmailError(message);
    AccessibilityInfo.announceForAccessibility(message);
    emailRef.current?.focus();
  }

  async function handleSend() {
    if (sending) return;
    setFormError(null);

    const error = validateEmail(email);
    if (error) {
      showEmailError(error);
      return;
    }

    setSending(true);
    try {
      await sendPasswordReset(email);
      router.replace({
        pathname: "/auth/check-email",
        params: { email: email.trim() },
      });
    } catch (err) {
      const { field, message } = getAuthFormError(err);
      if (field === "email") {
        showEmailError(message);
      } else {
        setFormError(message);
        AccessibilityInfo.announceForAccessibility(message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthScreen
      title="Forgot password"
      onClose={() => router.dismissTo("/auth/login")}
    >
      <Text className="font-sans text-lg text-white">
        Enter the email you use for Dented Puck. We’ll send you a link to set a
        new password.
      </Text>

      <AuthTextField
        ref={emailRef}
        label="Email"
        placeholder="Enter your Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError(null);
        }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      {formError ? <AuthErrorMessage message={formError} /> : null}

      <AuthButton
        label="Send reset link"
        loadingLabel="Sending…"
        loading={sending}
        onPress={handleSend}
      />

      <View className="mt-6 flex-1 justify-end">
        <View className="flex-row justify-center">
          <AuthLinkButton
            label="Back to Log in"
            onPress={() => router.dismissTo("/auth/login")}
          />
        </View>
      </View>
    </AuthScreen>
  );
}
