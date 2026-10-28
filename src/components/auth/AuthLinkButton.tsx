import { Pressable, Text } from "react-native";

interface AuthLinkButtonProps {
  label: string;
  onPress: () => void;
}

export function AuthLinkButton({ label, onPress }: AuthLinkButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-11 justify-center self-start active:opacity-70"
    >
      <Text className="font-sans-bold text-lg leading-[26px] text-white underline">
        {label}
      </Text>
    </Pressable>
  );
}
