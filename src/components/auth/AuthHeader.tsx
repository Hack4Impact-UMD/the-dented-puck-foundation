import type { Ref } from "react";
import { Image, Pressable, Text, View, type TextInstance } from "react-native";

interface AuthHeaderProps {
  title: string;
  onClose: () => void;
  titleRef?: Ref<TextInstance>;
}

export function AuthHeader({ title, onClose, titleRef }: AuthHeaderProps) {
  return (
    <View className="min-h-[60px] flex-row items-center border-b border-line-dark px-2">
      <View className="h-12 w-12" />
      <Text
        ref={titleRef}
        accessibilityRole="header"
        className="flex-1 text-center font-sans-bold text-[21px] leading-[30px] text-white"
      >
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="h-12 w-12 items-center justify-center active:opacity-70"
      >
        <Image source={require("@/assets/icons/close.png")} style={{ width: 24, height: 24 }} />
      </Pressable>
    </View>
  );
}
