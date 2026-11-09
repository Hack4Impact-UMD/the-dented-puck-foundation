import { AccessibilityInfo, Text, View } from 'react-native';
import AppButton from '@/components/team/AppButton';
import { getInitials } from './eventFormat';

type Props = {
  title: string;
  teamName: string;
  followed: boolean;
  onToggleFollow: () => void;
};

// Reading order: title, team, Follow.
export function EventHeader({ title, teamName, followed, onToggleFollow }: Props) {
  const followLabel = (isFollowed: boolean) => `${isFollowed ? 'Following' : 'Follow'} ${teamName}`;

  const toggle = () => {
    onToggleFollow();
    AccessibilityInfo.announceForAccessibility(followLabel(!followed));
  };

  return (
    <View className="gap-4 border-b border-line-dark bg-surface-alt-dark px-4 py-6">
      {/* One stop for the whole title: on web a reader otherwise steps through a wrapped title line by line. */}
      <View accessible accessibilityRole="header" accessibilityLabel={title}>
        <Text aria-hidden className="font-sans-bold text-3xl text-white">
          {title}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          {/* Decorative badge; the team name beside it is what gets read. */}
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="h-10 w-10 items-center justify-center rounded-full bg-brand"
          >
            <Text className="font-sans-bold text-base text-on-brand">{getInitials(teamName)}</Text>
          </View>
          <Text
            accessibilityLabel={teamName}
            accessibilityRole="text"
            className="shrink font-sans text-lg text-white"
          >
            {teamName}
          </Text>
        </View>

        {/* Followed is the outline variant: gold outline and text on near-black. The gray is the card around it. */}
        <AppButton
          title={followed ? 'Followed' : 'Follow'}
          accessibilityLabel={followLabel(followed)}
          variant={followed ? 'outline' : 'secondary'}
          onPress={toggle}
          className="min-w-[96px] px-4"
        />
      </View>
    </View>
  );
}
