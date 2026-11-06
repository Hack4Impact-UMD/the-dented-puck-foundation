import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  createTeamSearch,
  fetchAllTeams,
  searchProducts,
} from "@/services/teamService";

import TeamHeader from "@/components/team/TeamHeader";
import TeamListRow from "@/components/team/TeamListRow";
import SearchIcon from "@/assets/icons/search.svg";
import { TeamWithId } from "@/types";

export default function FindTeamScreen() {
  // useQuery in order to store and fetch the list of teams
  const { data: teams = [], isLoading, isError } = useQuery<TeamWithId[]>({
    queryKey: ["teams"],
    queryFn: fetchAllTeams,
  });

  // state var for search bar input
  const [search, setSearch] = useState("");

  // create fuse instance when teams change
  const fuse = useMemo(() => createTeamSearch(teams), [teams]);

  // search the terms using a service function
  const filteredTeams = search.trim()
    ? searchProducts(fuse, search.trim())
    : teams;

  let sortedFilteredTeams;

  // // sort the searched teams list based on the user's current location
  // if(){
  // // 
  // } else {

  // }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      {/* Top header */}
      <View className="w-full border-b border-line-dark">
        <TeamHeader
          onBack={() => router.back()}
          onCreate={() => router.push("/tabs/teams/create")}
        />
      </View>
      {/* Main section */}
      <View className="w-full flex-1 min-h-0 self-stretch flex-col items-start px-4 pt-5 pb-10">
        <Text
          accessibilityRole="header"
          className="text-lg font-sans-bold text-white"
        >
          Search teams
        </Text>

        <View className="mt-3 h-14 w-full flex-row items-center rounded border-2 border-white bg-surface-field px-4">
          <View
            pointerEvents="none"
            className="items-center justify-center"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <SearchIcon width={24} height={24} />
          </View>
          <TextInput
            accessibilityLabel="Search teams"
            accessibilityHint="Search by team name or city"
            autoCapitalize="none"
            className="pb-1 ml-3 h-full min-w-0 flex-1 font-sans text-lg text-white"
            onChangeText={setSearch}
            placeholder="Team name or city"
            placeholderTextColor="#BDBDBD"
            returnKeyType="search"
            textAlignVertical="center"
            value={search}
          />
        </View>

        <Text className="mt-5 self-stretch font-sans text-lg leading-[26px] text-ink-subtle">
          {isError
            ? "Error: failed to fetch teams near College Park, MD"
            : `${filteredTeams.length} teams near College Park, MD${search.trim() ? " match your search" : ""}`}
        </Text>

        {isLoading ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-lg leading-[26px] text-ink-subtle">
              Loading teams...
            </Text>
          </View>
        ) : isError && teams.length === 0 ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-lg leading-[26px] text-ink-subtle">
              Unable to load teams. Please try again.
            </Text>
          </View>
        ) : teams.length === 0 ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-lg leading-[26px] text-ink-subtle">
              No teams have joined yet
            </Text>
          </View>
        ) : (
          <ScrollView
            accessibilityLabel="Nearby teams"
            className="mt-3 w-full flex-1 min-h-0 border-b border-ink-subtle"
            contentContainerClassName="w-full"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {filteredTeams.map((team, index) => (
              <TeamListRow
                key={`${team.name}`}
                team={team}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
