import { Text, View } from 'react-native';

export default function TeamBadge({ teamName }: { teamName: string }) {
  const initials = teamName.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase(); //how I extract the initials from the team name

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${teamName} logo`}
      className="h-40 w-40 items-center justify-center rounded-full bg-brand"
    >
      <Text accessible={false} className="font-['AtkinsonHyperlegibleBold'] text-[40px] leading-[48px] text-on-brand">
        {initials}
      </Text>
    </View>
  );
}
