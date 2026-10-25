import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthLinkButton } from "@/components/auth/AuthLinkButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { OrDivider } from "@/components/auth/OrDivider";
import { PasswordField } from "@/components/auth/PasswordField";
import { PASSWORD_REQUIREMENT } from "@/utils/validation";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);

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
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <PasswordField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              helperText={PASSWORD_REQUIREMENT}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
            />

            <AuthButton label="Create account" />

            <OrDivider />

            <AuthButton
              variant="secondary"
              label="Continue with Google"
              icon={require("@/assets/icons/google.png")}
            />
            <AuthButton
              variant="secondary"
              label="Continue with Apple"
              icon={require("@/assets/icons/apple.png")}
            />

            {/* Pushed to the bottom of the screen; wraps instead of clipping at large text sizes */}
            <View className="mt-6 flex-1 justify-end">
              <View className="flex-row flex-wrap items-center justify-center gap-x-1.5">
                <Text className="font-sans text-lg leading-[26px] text-white">Already have an account?</Text>
                <AuthLinkButton label="Log in" onPress={goToLogin} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
