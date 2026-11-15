import { Pressable, Text, View } from 'react-native';

interface InviteActionsProps {
  onCreateAccount: () => void;
  onLogIn: () => void;
}

export default function InviteActions({ onCreateAccount, onLogIn }: InviteActionsProps) {
  return (
    <View className="mt-12 w-full gap-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create account"
        onPress={onCreateAccount}
        className="min-h-14 w-full items-center justify-center rounded border border-brand bg-brand px-4 py-3 active:opacity-80"
      >
        <Text className="text-center font-['AtkinsonHyperlegibleBold'] text-[18px] leading-[24px] text-on-brand">Create account</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log in"
        onPress={onLogIn}
        className="min-h-14 w-full items-center justify-center rounded border border-brand bg-brand-soft-dark px-4 py-3 active:opacity-80"
      >
        <Text className="text-center font-['AtkinsonHyperlegibleBold'] text-[18px] leading-[24px] text-brand">Log in</Text>
      </Pressable>
    </View>
  );
}
