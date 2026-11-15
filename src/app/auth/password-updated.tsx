import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { AuthButton } from "@/components/auth/AuthButton";
import CheckIcon from "@/assets/icons/check.svg";

export default function PasswordUpdatedScreen() {
  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerClassName="flex-grow items-center gap-4 px-4 pb-11 pt-[84px]">
          <View
            aria-hidden
            className="h-[142px] w-[142px] items-center justify-center rounded-full bg-brand"
          >
            <CheckIcon width={72} height={72} />
          </View>

          <Text
            accessibilityRole="header"
            className="text-center font-sans-bold text-[26px] leading-[34px] text-white"
          >
            Password updated
          </Text>
          <Text className="max-w-[340px] text-center font-sans text-lg leading-[26px] text-ink-soft">
            You can now log in to Dented Puck with your new password.
          </Text>

          <View className="w-full">
            <AuthButton
              label="Log in"
              onPress={() => router.dismissTo("/auth/login")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
