import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { auth } from "@/firebase";
import { getUserProfile, type UserProfile } from "@/services/authService";
import {
  createTeamSearch,
  fetchAllTeams,
  searchProducts,
  sortTeamsByProximity,
  type SearchOrigin,
} from "@/services/teamService";

import TeamHeader from "@/components/team/TeamHeader";
import TeamListRow from "@/components/team/TeamListRow";
import SearchIcon from "@/assets/icons/search.svg";
import { TeamWithId } from "@/types";
import { regions } from "@/services/locationService";

// DELETE FOR PRODUCTION - TESTING LOGGED IN USER WHO ALLOWS LOCATION
const MOCK_SIGNED_IN_USER_WITH_LOCATION = true;

export default function FindTeamScreen() {
  const useLiveLocation = useRef<boolean | undefined>(undefined);
  const [locationPreferenceStatus, setLocationPreferenceStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [searchOrigin, setSearchOrigin] = useState<SearchOrigin | null>(null);

  useEffect(() => {
    const loadUserLocationPreference = async () => {
      let profile: Pick<UserProfile, "allowLocation" | "regionId">;

      // DELETE FOR PRODUCTION - TESTING LOGGED IN USER WHO ALLOWS LOCATION
      if (MOCK_SIGNED_IN_USER_WITH_LOCATION) {
        // Temporary local test mode: simulate a signed-in user who allows location.
        profile = { allowLocation: true, regionId: 1 };
      } else {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          throw new Error("A signed-in user is required to load location preferences.");
        }
        profile = await getUserProfile(uid);
      }

      useLiveLocation.current = profile.allowLocation !== false;
      if (useLiveLocation.current) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          throw new Error("Foreground location permission was not granted.");
        }

        const position = await Location.getCurrentPositionAsync({});
        setSearchOrigin({
          type: "coordinates",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } else {
        setSearchOrigin({ type: "region", regionId: profile.regionId });
      }
      setLocationPreferenceStatus("loaded");
    };

    void loadUserLocationPreference().catch((error: unknown) => {
      console.error("Failed to load location preference for team search.", error);
      setLocationPreferenceStatus("error");
    });
  }, []);

  // useQuery in order to store and fetch the list of teams
  const { data: teams = [], isLoading: teamsLoading, isError } = useQuery<TeamWithId[]>({
    queryKey: ["teams"],
    queryFn: fetchAllTeams,
  });
  const isPageLoading = teamsLoading || locationPreferenceStatus === "loading";

  // state var for search bar input
  const [search, setSearch] = useState("");

  // create fuse instance when teams change
  const fuse = useMemo(() => createTeamSearch(teams), [teams]);

  // search the terms using a service function
  const filteredTeams = search.trim()
    ? searchProducts(fuse, search.trim())
    : teams;

  const sortedFilteredTeams = useMemo(
    () => (searchOrigin ? sortTeamsByProximity(filteredTeams, searchOrigin) : []),
    [filteredTeams, searchOrigin],
  );
  const originLabel =
    searchOrigin?.type === "region"
      ? (() => {
          const region = regions.find(
            (item) => item.regionId === searchOrigin.regionId,
          );
          return region
            ? `${region.city}, ${region.state || region.country}`
            : "your region";
        })()
      : "your location";

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
          className="text-3xl font-sans-bold text-white"
        >
          Search teams
        </Text>

        <View className="mt-3 h-16 w-full flex-row items-center rounded border-2 border-white bg-surface-field px-4">
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
            className="pb-1 ml-3 h-full min-w-0 flex-1 font-sans text-2xl text-white"
            onChangeText={setSearch}
            placeholder="Team name or city"
            placeholderTextColor="#BDBDBD"
            returnKeyType="search"
            textAlignVertical="center"
            value={search}
          />
        </View>

        <Text className="mt-5 self-stretch font-sans-bold text-2xl leading-9 text-ink-subtle">
          {locationPreferenceStatus === "error"
            ? "Error: failed to load your location"
            : isError
            ? `Error: failed to fetch teams near ${originLabel}`
            : `${filteredTeams.length} teams near ${originLabel}${search.trim() ? " match your search" : ""}`}
        </Text>

        {isPageLoading ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-2xl leading-9 text-ink-subtle">
              Loading teams...
            </Text>
          </View>
        ) : locationPreferenceStatus === "error" ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-2xl leading-9 text-ink-subtle">
              Unable to load your location. Please try again.
            </Text>
          </View>
        ) : isError && teams.length === 0 ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-2xl leading-9 text-ink-subtle">
              Unable to load teams. Please try again.
            </Text>
          </View>
        ) : teams.length === 0 ? (
          <View className="mt-3 w-full flex-1 min-h-0 items-center justify-center border-b border-ink-subtle">
            <Text className="text-center font-sans text-2xl leading-9 text-ink-subtle">
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
            {sortedFilteredTeams.map(({ team, distanceMiles }) => (
              <TeamListRow
                key={`${team.name}`}
                team={team}
                distanceMiles={distanceMiles}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
