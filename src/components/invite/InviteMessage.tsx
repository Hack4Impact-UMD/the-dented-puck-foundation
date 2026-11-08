import { Text, View } from 'react-native';

export default function InviteMessage({ teamName }: { teamName: string }) {
  return (
    <View className="w-full items-center">
      <Text
        accessibilityRole="header"
        className="mt-8 w-full text-center font-['AtkinsonHyperlegibleBold'] text-[32px] leading-[40px] text-white"
      >
        {'You have been invited to\njoin the\n'}{teamName}
      </Text>
      <Text className="mt-5 max-w-64 text-center font-['AtkinsonHyperlegibleRegular'] text-[18px] leading-[26px] text-gray-300">
        Create an account or log in to continue.
      </Text>
    </View>
  );
}
