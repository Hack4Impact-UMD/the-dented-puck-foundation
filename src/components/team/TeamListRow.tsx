import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import ChevronForwardIcon from "@/assets/icons/chevron-forward.svg";
import { TeamWithId } from "@/types";
import TeamIcon from "@/components/team/TeamIcon";
import { regions } from "@/services/teamService";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from "@/components/accessibility";

type TeamListRowProps = ScreenReaderControlProps & {
  team: TeamWithId;
  distanceMiles: number;
  onPress?: () => void;
};

// Functional component to use in the tabs/teams/find page.
// It represents a row for one team in the grid of team results in the page.
export default function TeamListRow({
  team,
  distanceMiles,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: TeamListRowProps) {
  const region = regions[Number(team.region) - 1];
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const openTeam = () =>
    router.push({
      pathname: "/tabs/teams/[teamId]",
      params: { teamId: team.id },
    });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      accessibilityRole="button"
      accessible={true}
      accessibilityLabel={
        screenReaderLabel ??
        `${team.name}, ${region.city}, ` + (region.state ?? region.country) + `, ${distanceMiles} miles away`
      }
      accessibilityHint={screenReaderHint}
      onPress={withPressAnnouncement(onPress ?? openTeam, screenReaderPressAnnouncement)}
      className="w-full flex-row items-center gap-3 border-b border-line-dark py-3.5"
    >
      <TeamIcon name={team.name} size={48} textSize={18} />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-[21px] leading-7 text-white">
          {team.name}
        </Text>
        <Text className="font-sans text-caption text-ink-subtle">
          {region.city}, {region.state ? region.state : region.country}
        </Text>
      </View>
      <Text className="font-sans-bold text-lg text-white">
        {distanceMiles} mi
      </Text>
      <ChevronForwardIcon width={24} height={24} />
    </Pressable>
  );
}
