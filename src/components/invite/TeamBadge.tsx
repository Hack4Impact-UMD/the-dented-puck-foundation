import { Text, View } from 'react-native';

export default function TeamBadge({ teamName }: { teamName: string }) {
  // Use the first letters of up to two words for the team badge.
  const initials = teamName.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  // Read the team logo label once instead of reading the initials too.
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
