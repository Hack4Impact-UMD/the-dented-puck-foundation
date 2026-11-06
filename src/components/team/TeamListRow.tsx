import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { TeamWithId } from "@/types";
import TeamIcon from "@/components/team/TeamIcon";
import { regions } from "@/services/locationService";

type TeamListRowProps = {
  team: TeamWithId;
};

// Functional component to use in the tabs/teams/find page.
// It represents a row for one team in the grid of team results in the page.
export default function TeamListRow({ team }: TeamListRowProps) {
  const region = regions[Number(team.region) - 1];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${team.name}, ${team.region}, 5 miles away`}
      onPress={() =>
        router.push({
          pathname: "/tabs/teams/[teamId]",
          params: { teamId: team.id },
        })
      }
      className="min-h-[98px] w-full flex-row items-center gap-3 border-b border-line-dark py-4"
    >
      <TeamIcon name={team.name} size={58} />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-2xl leading-[30px] text-white">
          {team.name}
        </Text>
        <Text className="font-sans text-lg leading-[26px] text-ink-subtle">
          {region.city},{" "}
          {region.state
            ? region.state
            : region.country}
        </Text>
      </View>
      <Text className="font-sans-bold text-lg text-white">5 miles</Text>
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
