import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { TeamWithId } from "@/types";
import TeamIcon from "@/components/team/TeamIcon";
import { getRegion } from "@/services/teamService";

type TeamListRowProps = {
  team: TeamWithId;
  distanceMiles: number;
};

// Functional component to use in the tabs/teams/find page.
// It represents a row for one team in the grid of team results in the page.
export default function TeamListRow({ team, distanceMiles }: TeamListRowProps) {
  const region = getRegion(team.region);
  const locationText = region
    ? `${region.city}, ${region.state ? region.state : region.country}`
    : typeof team.region === "string" && team.region
      ? team.region
      : "Location unavailable";

  return (
    <Pressable
      accessibilityRole="button"
      accessible={true}
      accessibilityLabel={
        `${team.name}, ${locationText}, ${distanceMiles} miles away`
      }
      onPress={() =>
        router.push({
          pathname: "/tabs/teams/[teamId]",
          params: { teamId: team.id },
        })
      }
      className="min-h-[108px] w-full flex-row items-center gap-3 border-b border-line-dark py-4"
    >
      <TeamIcon name={team.name} size={58} />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-2xl leading-[30px] text-white">
          {team.name}
        </Text>
        <Text className="font-sans text-xl leading-[30px] text-ink-subtle">
          {locationText}
        </Text>
      </View>
      <Text className="font-sans-bold text-xl text-white">
        {distanceMiles} mi
      </Text>
      <Ionicons
        name="chevron-forward"
        size={24}
        color="#FFFFFF"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}
