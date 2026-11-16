import { auth } from "@/firebase";
import { getUserProfile, type UserProfile } from "@/services/authService";
import {
  getTeamsUserIds,
  getShortUserInfo,
  isUserInTeam,
  createShortUserInfoSearch,
  searchShortUserInfoList,
} from "@/services/teamService";
import { Role, ShortUserInfo } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, View, Text } from "react-native";

// navigate to this page with a custom field: teamId

export default function NewMessageScreen() {
  // will have the teamId we pass in when routing to this page (required)
  const params = useLocalSearchParams();
  const teamId: string =
    typeof params.teamId === "string" ? params.teamId : "";

  const [profile, setProfile] = useState<Pick<
    UserProfile,
    "userId" | "role"
  > | null>(null);

  useEffect(() => {
    // validates that teamId is present
    if (teamId.trim() === "") {
      return;
    }

    const loadUserDataAndValidateTeam = async () => {
      // check if there is a user currently logged in
      const uid = auth.currentUser?.uid;
      if (!uid) {
        router.replace("/auth/login");
        return;
      }
      // validate that currently logged in user is part of the current team
      try {
        const userProfile = await getUserProfile(uid);
        const isCurrentUserInTeam = await isUserInTeam(
          userProfile.userId.toString(),
          teamId,
        );

        if (!isCurrentUserInTeam) {
          router.back();
          return;
        }
        // set the state var for currently logged in user
        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to validate team membership:", error);
        Alert.alert(
          "Unable to load team",
          error instanceof Error ? error.message : "Please try again.",
        );
      }
    };

    void loadUserDataAndValidateTeam();
  }, [teamId]);

  // useQuery in order to store and fetch
  // the list of users in this team
  // it will be a map mapping the userId of a team member
  // onto an object with the user's name, role, userId and selected status
  const {
    data: fullTeamShortUserList = [],
    isLoading: isTeamLoading,
    isError,
  } = useQuery<ShortUserInfo[]>({
    queryKey: [`ShortUserInfo-team_${teamId}`],
    enabled: teamId.trim() !== "",
    queryFn: async () => {
      const teamUserIds = await getTeamsUserIds(teamId);
      const shortUserInfoList = await Promise.all(
        teamUserIds.map((userId) => getShortUserInfo(userId)),
      );
      const sortedShortUserInfoList = shortUserInfoList.sort(
        (shortUserInfo1, shortUserInfo2) =>
          shortUserInfo1.username.localeCompare(shortUserInfo2.username),
      );
      return sortedShortUserInfoList;
    },
  });

  function getUserRole(userId: string): Role | undefined {
    return fullTeamShortUserList.find((member) => member.userId === userId)?.role;
  }

  // state var for search bar input
  const [search, setSearch] = useState<string>("");

  // create fuse instance when teams change
  const fuse = useMemo(
    () => createShortUserInfoSearch(fullTeamShortUserList),
    [fullTeamShortUserList],
  );

  // search the team members list using a service function
  const filteredMembers = search.trim()
    ? searchShortUserInfoList(fuse, search.trim())
    : fullTeamShortUserList;

  // set of userIds of users that are selected for a new message
  const [selectedMembersUserIds, setSelectedMembersUserIds] = useState<
    Set<string>
  >(() => new Set());

  // function to toggle selection of a user in the backend
  function toggleUserSelectionStatus(userId: string) {
    setSelectedMembersUserIds((currentSet) => {
      const updatedSet = new Set(currentSet);
      if (updatedSet.has(userId)) {
        updatedSet.delete(userId);
      } else {
        updatedSet.add(userId);
      }
      return updatedSet;
    });
  }

  // MAY NOT BE NEEDED
  //   // Populates the selectedMembersUserIds with the currently
  //   // logged in user's userId when a user logs in
  //   useEffect(() => {
  //     if (!profile) return;

  //     const userId = profile.userId.toString();
  //     if(!selectedMembersUserIds.has(userId)){
  //         toggleUserSelectionStatus(userId);
  //     }
  //   }, [profile, profile?.userId]);

  // checks if onlyPlayers are selected
  const onlyPlayersError=
    (!profile || !profile?.role)
      ? false
      : ((profile.role === "player") &&
        (Array.from(selectedMembersUserIds).reduce((acc, userId) => {
            const role = getUserRole(userId);
            if(role && (!(role === "player"))){
                acc += 1;
            }
            return acc;
        }, 0)) === 0);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text accessibilityRole="header" className="text-xl text-white">
        New Message Screen
      </Text>
    </View>
  );
}
