import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Text,
  View,
  type TextInstance,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthLinkButton } from "@/components/auth/AuthLinkButton";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { getAuthFormError, sendPasswordReset } from "@/services/authService";

// Lets the screen transition finish before moving focus
const SCREEN_READER_FOCUS_DELAY_MS = 300;

export default function CheckEmailScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const confirmationRef = useRef<TextInstance>(null);

  // Focus lands on the confirmation when the screen opens, not the title
  useEffect(() => {
    if (Platform.OS === "web") return;
    const timer = setTimeout(() => {
      if (confirmationRef.current) {
        AccessibilityInfo.sendAccessibilityEvent(
          confirmationRef.current,
          "focus",
        );
      }
    }, SCREEN_READER_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  async function handleResend() {
    if (sending) return;
    setFormError(null);
    setSending(true);
    try {
      await sendPasswordReset(email);
      AccessibilityInfo.announceForAccessibility("Link sent");
    } catch (err) {
      const { message } = getAuthFormError(err);
      setFormError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthScreen
      title="Forgot password"
      onClose={() => router.dismissTo("/auth/login")}
    >
      <Text ref={confirmationRef} className="font-sans text-lg text-white">
        If there’s a Dented Puck account for this email, we sent a link to reset
        your password:
      </Text>

      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={email}
        className="min-h-14 justify-center rounded border-2 border-white bg-surface-field px-4"
      >
        <Text className="font-sans-bold text-lg text-white">{email}</Text>
      </View>

      <Text className="font-sans text-lg text-white">
        The link expires in 30 minutes. Don’t see it? Check your spam folder.
      </Text>

      {formError ? <AuthErrorMessage message={formError} /> : null}

      <AuthButton
        label="Send reset link"
        accessibilityLabel="Send reset link again"
        loadingLabel="Sending…"
        loading={sending}
        onPress={handleResend}
      />
      <AuthButton
        variant="secondary"
        label="Use a different email"
        disabled={sending}
        onPress={() => router.replace("/auth/forgot-password")}
      />

      {/* Pushed to the bottom of the screen */}
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
