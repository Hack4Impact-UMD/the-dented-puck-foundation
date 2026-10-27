import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { FirebaseError } from "firebase/app";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthLinkButton } from "@/components/auth/AuthLinkButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { OrDivider } from "@/components/auth/OrDivider";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  getAuthFormError,
  signInWithApple,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/authService";
import {
  PASSWORD_REQUIREMENT,
  validateEmail,
  validatePassword,
} from "@/utils/validation";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  function handleClose() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  function goToLogin() {
    router.replace("/auth/login");
  }

  function clearErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setEmailExists(false);
  }

  function showFormError(message: string) {
    setFormError(message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  async function handleCreateAccount() {
    if (pending) return;
    clearErrors();

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    if (nextEmailError || nextPasswordError) {
      setEmailError(nextEmailError);
      setPasswordError(nextPasswordError);
      AccessibilityInfo.announceForAccessibility(
        [nextEmailError, nextPasswordError].filter(Boolean).join(" "),
      );
      (nextEmailError ? emailRef : passwordRef).current?.focus();
      return;
    }

    setPending("email");
    try {
      await signUpWithEmail(email, password);
      router.replace("/auth/verify-email");
    } catch (err) {
      const { field, code, message } = getAuthFormError(err);
      if (field === "email") {
        setEmailError(message);
        setEmailExists(code === "auth/email-already-in-use");
        AccessibilityInfo.announceForAccessibility(message);
        emailRef.current?.focus();
      } else {
        showFormError(message);
      }
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    if (pending) return;
    clearErrors();
    setPending("google");
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        err.code === "auth/popup-closed-by-user"
      )
        return;
      showFormError(getAuthFormError(err).message);
    } finally {
      setPending(null);
    }
  }

  async function handleApple() {
    if (pending) return;
    clearErrors();
    try {
      await signInWithApple();
    } catch (err) {
      showFormError(getAuthFormError(err).message);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <AuthHeader title="Create an account" onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow gap-5 px-4 pb-11 pt-6"
          >
            <AuthTextField
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
                setEmailExists(false);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            >
              {emailExists ? (
                <AuthLinkButton label="Log in instead" onPress={goToLogin} />
              ) : null}
            </AuthTextField>

            <PasswordField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
              error={passwordError}
              helperText={PASSWORD_REQUIREMENT}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleCreateAccount}
            />

            {formError ? <AuthErrorMessage message={formError} /> : null}

            <AuthButton
              label="Create account"
              loadingLabel="Creating account…"
              loading={pending === "email"}
              disabled={pending === "google"}
              onPress={handleCreateAccount}
            />

            <OrDivider />

            <AuthButton
              variant="secondary"
              label="Continue with Google"
              icon={require("@/assets/icons/google.png")}
              loading={pending === "google"}
              disabled={pending === "email"}
              onPress={handleGoogle}
            />
            <AuthButton
              variant="secondary"
              label="Continue with Apple"
              icon={require("@/assets/icons/apple.png")}
              disabled={pending !== null}
              onPress={handleApple}
            />

            <View className="mt-6 flex-1 justify-end">
              <View className="flex-row flex-wrap items-center justify-center gap-x-1.5">
                <Text className="font-sans text-lg leading-[26px] text-white">
                  Already have an account?
                </Text>
                <AuthLinkButton label="Log in" onPress={goToLogin} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
