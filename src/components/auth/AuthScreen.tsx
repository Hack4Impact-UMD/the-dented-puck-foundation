import { useEffect, useRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type TextInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthHeader } from "./AuthHeader";

interface AuthScreenProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Shared shell for the auth form screens
export function AuthScreen({ title, onClose, children }: AuthScreenProps) {
  const titleRef = useRef<TextInstance>(null);

  useEffect(() => {
    if (Platform.OS !== "web" && titleRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(titleRef.current, "focus");
    }
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <AuthHeader title={title} onClose={onClose} titleRef={titleRef} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="flex-grow gap-5 px-4 pb-11 pt-6"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
