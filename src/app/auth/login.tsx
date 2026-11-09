import { useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Text,
  View,
  type TextInputInstance,
} from "react-native";
import { router } from "expo-router";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthLinkButton } from "@/components/auth/AuthLinkButton";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { OrDivider } from "@/components/auth/OrDivider";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  continueWithGoogle,
  getAuthFormError,
  getPostSignInRoute,
  signInWithApple,
  signInWithEmail,
} from "@/services/authService";
import { validateLoginFields } from "@/utils/validation";

const WRONG_CREDENTIALS_TITLE = "Email or password is incorrect.";
const WRONG_CREDENTIALS_MESSAGE =
  "Check them and try again, or reset your password.";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [wrongCredentials, setWrongCredentials] = useState(false);
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

  function goToForgotPassword() {
    router.push({
      pathname: "/auth/forgot-password",
      params: { email: email.trim() },
    });
  }

  function clearErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setWrongCredentials(false);
  }

  function showFormError(message: string) {
    setFormError(message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  async function handleLogin() {
    if (pending) return;
    clearErrors();

    const errors = validateLoginFields(email, password);
    if (errors.email || errors.password) {
      setEmailError(errors.email);
      setPasswordError(errors.password);
      AccessibilityInfo.announceForAccessibility(
        [errors.email, errors.password].filter(Boolean).join(" "),
      );
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setPending("email");
    try {
      const user = await signInWithEmail(email, password);
      router.replace(await getPostSignInRoute(user));
    } catch (err) {
      const { field, message } = getAuthFormError(err);
      if (field === "credentials") {
        // Figma 5120: the email stays, the password clears
        setWrongCredentials(true);
        setPassword("");
        // Android announces the alert through its live region
        if (Platform.OS === "ios") {
          AccessibilityInfo.announceForAccessibility(
            `${WRONG_CREDENTIALS_TITLE} ${WRONG_CREDENTIALS_MESSAGE}`,
          );
        }
      } else if (field === "email") {
        setEmailError(message);
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
      const route = await continueWithGoogle();
      if (route) router.replace(route);
    } catch (err) {
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
    <AuthScreen title="Login" onClose={handleClose}>
      <View className="gap-2">
        {wrongCredentials ? (
          <AuthAlert
            title={WRONG_CREDENTIALS_TITLE}
            message={WRONG_CREDENTIALS_MESSAGE}
          />
        ) : null}
        <AuthTextField
          ref={emailRef}
          label="Email"
          placeholder="Enter your Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(null);
            setWrongCredentials(false);
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      <PasswordField
        ref={passwordRef}
        label="Password"
        placeholder="Enter Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(null);
          setWrongCredentials(false);
        }}
        error={passwordError}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <AuthLinkButton
        label="Forgot password?"
        bold={false}
        onPress={goToForgotPassword}
      />

      {formError ? <AuthErrorMessage message={formError} /> : null}

      <AuthButton
        label="Login"
        loadingLabel="Logging in…"
        loading={pending === "email"}
        disabled={pending === "google"}
        onPress={handleLogin}
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
            Not a member?
          </Text>
          <AuthLinkButton
            label="Join now"
            onPress={() => router.push("/auth/signup")}
          />
        </View>
      </View>
    </AuthScreen>
  );
}
