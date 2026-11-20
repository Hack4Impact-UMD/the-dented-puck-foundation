import { auth } from "@/firebase";
import { getUserProfile } from "@/services/authService";
import {
  createShortUserInfoSearch,
  getShortUserInfo,
  getTeamsUserIds,
  isUserInTeam,
  searchShortUserInfoList,
} from "@/services/teamService";
import { Role } from "@/types";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { UserProfile } from "firebase/auth";
import { ComponentRef, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  View,
  Text,
  AccessibilityInfo,
  Alert,
  SectionList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ShortUserInfo = {
  userId: string;
  username: string;
  role: Role;
};

// Helper function that inputs a user or user role directly
// and outputs a boolean representing if the user is a staff user
function isUserStaff(user: ShortUserInfo | string): boolean {
  let userId;
  if (typeof user === "string") {
    userId = user;
  } else {
    userId = user.role;
  }
  return !(userId === "player" || userId === "contact");
}

// for the member's avatar logo
function initials(name: string) {
  const words = name.replace(/\./g, "").trim().split(/\s+/);
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

// component for when a member is selected as a message recipient
function RecipientCard({
  member,
  blocked,
  onRemove,
}: {
  member: ShortUserInfo;
  blocked: boolean;
  onRemove: () => void;
}) {
  return (
    <View
      className={`min-h-11 max-w-full flex-row items-center gap-0.5 self-start rounded border-2 pl-3.5 pr-0.5 ${
        blocked
          ? "border-danger-dark bg-[#2A1210]"
          : "border-brand bg-brand-soft-dark"
      }`}
    >
      <Text className="shrink font-sans text-[18px] leading-[26px] text-white">
        {member.username} · {member.role}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${member.username}`}
        onPress={onRemove}
        className="h-10 w-10 items-center justify-center"
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

// component for each member to be added as a recipient
function MemberRow({
  member,
  selected,
  onToggle,
}: {
  member: ShortUserInfo;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${member.username}, ${member.role}`}
      onPress={onToggle}
      className="min-h-16 flex-row items-center gap-3.5 border-b border-[#2B2B2B] py-2"
    >
      {/* member avatar logo is yellow for coach/staff and whtie for players */}
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          isUserStaff(member) ? "bg-brand" : "bg-white"
        }`}
      >
        <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
          {initials(member.username)}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-[18px] leading-[26px] text-white">
          {member.username}
        </Text>
        <Text className="font-sans text-[18px] leading-[26px] text-ink-muted-dark">
          {member.role}
        </Text>
      </View>

      {/* checkbox circle if the member was selected as a recipient */}
      {selected ? (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-brand">
          <Ionicons name="checkmark" size={18} color="#010101" />
        </View>
      ) : (
        <View className="h-7 w-7 rounded-full border-2 border-line" />
      )}
    </Pressable>
  );
}

// alert text: shared by the visible alert and the screenreader announcement
const BLOCKED_TITLE = "Not allowed: player-to-player message";
const BLOCKED_MESSAGE =
  "Players can’t message another player one-on-one. Add a coach or staff member to start a group message.";

// alert component if a user tries to start a chat with only other players
function BlockedAlert() {
  const ref = useRef<ComponentRef<typeof View>>(null);

  // move screenreader focus to the alert so it's read right away
  // the delay lets VoiceOver finish reacting to the button press first
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current)
        AccessibilityInfo.sendAccessibilityEvent(ref.current, "focus");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      ref={ref}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${BLOCKED_TITLE}. ${BLOCKED_MESSAGE}`}
      className="flex-row items-start gap-3 rounded-lg border-2 border-danger-dark bg-[#2A1210] px-4 py-3.5"
    >
      <Ionicons
        name="ban-outline"
        size={26}
        color="#FF8A80"
        style={{ marginTop: 1 }}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans-bold text-[18px] leading-[26px] text-danger-dark">
          {BLOCKED_TITLE}
        </Text>
        <Text className="font-sans text-[18px] leading-[26px] text-white">
          {BLOCKED_MESSAGE}
        </Text>
      </View>
    </View>
  );
}

export default function NewMessageScreen() {
  // navigate to this page with a custom router field: teamId
  const params = useLocalSearchParams();
  const teamId: string = typeof params.teamId === "string" ? params.teamId : "";

  const [profile, setProfile] = useState<Pick<
    UserProfile,
    "userId" | "role"
  > | null>(null);

  const isCurrentUserStaff = profile
    ? isUserStaff(profile.role as string)
    : false;

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
        (shortUserInfo1: ShortUserInfo, shortUserInfo2: ShortUserInfo) =>
          shortUserInfo1.username.localeCompare(shortUserInfo2.username),
      );
      return sortedShortUserInfoList;
    },
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    setShowBlocked(false);
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  };

  // create fuse instance when teams change
  const fuse = useMemo(
    () => createShortUserInfoSearch(fullTeamShortUserList),
    [fullTeamShortUserList],
  );

  // search the team members list using a service function
  const filteredMembers = search.trim()
    ? searchShortUserInfoList(fuse, search.trim())
    : fullTeamShortUserList;

  const selected = fullTeamShortUserList.filter((m) =>
    selectedIds.includes(m.userId),
  );

  const blocked =
    !isCurrentUserStaff &&
    selected.length > 0 &&
    !selected.some((m) => isUserStaff(m));
  const canStartConversation = selected.length > 0 && !showBlocked;

  const handleStartConversation = () => {
    if (blocked) {
      setShowBlocked(true);
      return;
    }
    // TODO: Start conversation button functionality
  };

  const sections = (() => {
    return [
      {
        title: "Coaches and staff",
        data: filteredMembers.filter((m) => m.isStaff),
      },
      {
        title: "Players",
        data: filteredMembers.filter((m) => !isUserStaff(m)),
      },
    ].filter((s) => s.data.length > 0);
  })();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-black">
      {/* header */}
      <View className="flex-row items-center border-b border-[#2B2B2B] px-3 pb-2 pt-4">
        <View className="flex-1 items-start">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
            className="min-h-12 flex-row items-center gap-0.5 px-2"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text className="font-sans-bold text-[18px] leading-[26px] text-white">
              Cancel
            </Text>
          </Pressable>
        </View>
        <Text
          accessibilityRole="header"
          className="font-sans-bold text-[21px] leading-[30px] text-white"
        >
          New message
        </Text>
        <View className="flex-1" />
      </View>

      {/* alert */}
      {showBlocked && (
        <View className="px-5 pt-4">
          <BlockedAlert />
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
        }}
        ListHeaderComponent={
          <View className="gap-5 pb-5">
            {selected.length > 0 && (
              <View className="gap-2">
                <Text className="font-sans-bold text-[18px] leading-[26px] text-white">
                  To
                </Text>
                {selected.map((m) => (
                  <RecipientCard
                    key={m.userId}
                    member={m}
                    blocked={showBlocked && !isUserStaff(m)}
                    onRemove={() => toggle(m.userId)}
                  />
                ))}
              </View>
            )}

            <View className="gap-2">
              <Text className="font-sans-bold text-[18px] leading-[26px] text-white">
                {selected.length > 0 ? "Add more people" : "Add people"}
              </Text>
              <View className="min-h-[52px] flex-row items-center gap-2 rounded border-2 border-white bg-surface-alt-dark px-3">
                <Ionicons
                  name="search"
                  size={22}
                  color="#B3B3B3"
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <TextInput
                  accessibilityRole="search"
                  accessibilityLabel="Search people"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name"
                  placeholderTextColor="#757575"
                  autoCapitalize="none"
                  className="min-w-0 flex-1 font-sans text-[18px] text-white"
                />
              </View>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            className="pb-1 font-sans-bold text-[18px] leading-6 text-ink-muted-dark"
          >
            {section.title}
          </Text>
        )}
        renderSectionFooter={() => <View className="h-5" />}
        renderItem={({ item }) => (
          <MemberRow
            member={item}
            selected={selectedIds.includes(item.id)}
            onToggle={() => toggle(item.id)}
          />
        )}
      />

      {/* footer */}
      <View className="border-t border-[#2B2B2B] px-5 pb-3 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStartConversation }}
          disabled={!canStartConversation}
          onPress={handleStartConversation}
          className={`min-h-[52px] items-center justify-center rounded-lg ${
            canStartConversation
              ? "bg-brand active:opacity-80"
              : "border-2 border-line bg-surface-alt-dark"
          }`}
        >
          <Text
            className={`font-sans-bold text-[18px] leading-[26px] ${
              canStartConversation ? "text-on-brand" : "text-ink-muted-dark"
            }`}
          >
            Start conversation
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
