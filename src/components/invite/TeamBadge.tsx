import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type TeamBadgeProps = ScreenReaderStopProps & { teamName: string };

export default function TeamBadge({ teamName, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: TeamBadgeProps) {
  // Use the first letters of up to two words for the team badge.
  const initials = teamName.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  // Read the team logo label once instead of reading the initials too.
  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="image"
      accessibilityLabel={screenReaderLabel ?? `${teamName} logo`}
      className="h-[168px] w-[168px] items-center justify-center rounded-full bg-brand"
    >
      <Text accessible={false} className="font-['AtkinsonHyperlegibleBold'] text-[56px] text-on-brand">
        {initials}
      </Text>
    </View>
  );
}
