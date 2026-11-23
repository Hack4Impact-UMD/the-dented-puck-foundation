import { type ComponentRef, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@react-native-vector-icons/ionicons";
import NewMessageIcon from "@/assets/icons/new_message.svg";

import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import TeamDropdown, { type TeamOption } from "@/components/chats/TeamDropdown";
import MessageRow, {
  type MessageRowConversation,
} from "@/components/chats/MessageRow";
import { formatChatTime } from "@/utils/formatChatTime";
import { Channel } from "@/types";
import { getUserProfile, UserProfile } from "@/services/authService";
import { auth } from "@/firebase";
import {
  fetchTeamOptions,
  getUsersTeams,
  isUserStaff,
} from "@/services/teamService";

// PLACEHOLDER for timestamps
const DAY_MS = 24 * 60 * 60 * 1000;

// today at a fixed clock time, e.g. todayAt(21, 41) shows as "9:41 PM" to match Figma
const todayAt = (hour: number, minute: number) =>
  new Date().setHours(hour, minute, 0, 0);

// the most recent past weekday (0 = Sun ... 6 = Sat), at least 2 days ago so it shows as a weekday
const lastWeekday = (weekday: number) => {
  let daysBack = (new Date().getDay() - weekday + 7) % 7;
  if (daysBack < 2) daysBack += 7;
  return todayAt(12, 0) - daysBack * DAY_MS;
};

// PLACEHOLDER until auth provides the current user's role
// team members can see Admins + Team
// followers (not on the team) only see Admins
const IS_TEAM_MEMBER = true;

// PLACEHOLDER until chats are fetched
const LOADING = false;

// PLACEHOLDER for Conversations info
const CONVERSATIONS: MessageRowConversation[] = [
  {
    id: "4",
    participants: ["Morgan K."],
    isStaff: false,
    lastMessage: "See you Saturday!",
    updatedAt: lastWeekday(4),
    unread: 0,
  },
  {
    id: "1",
    participants: ["Jordan P."],
    isStaff: false,
    lastMessage: "Who is bringing pucks?",
    updatedAt: todayAt(21, 41),
    unread: 2,
  },
  {
    id: "3",
    participants: ["Taylor M.", "Morgan K."],
    isStaff: false,
    lastMessage: "Carpool from the rink?",
    updatedAt: todayAt(18, 0) - DAY_MS,
    unread: 2,
  },
  {
    id: "5",
    participants: ["Pat L."],
    isStaff: true,
    lastMessage: "Thanks for the update",
    updatedAt: lastWeekday(1),
    unread: 0,
  },
  {
    id: "2",
    participants: ["Coach Riley"],
    isStaff: true,
    lastMessage: "Jersey sizes are due Friday",
    updatedAt: todayAt(21, 12),
    unread: 1,
  },
];

// newest conversation first
const byMostRecent = (a: { updatedAt: number }, b: { updatedAt: number }) =>
  b.updatedAt - a.updatedAt;

type Section = "channels" | "messages";

// PLACEHOLDER for channel info
const CHANNELS: Channel[] = [
  {
    id: "admins",
    name: "Admins",
    lastSender: "Coach Sam",
    lastMessage: "Lineup for Saturday is posted",
    updatedAt: todayAt(21, 41),
    unread: 2,
  },
  {
    id: "team",
    name: "Team",
    lastSender: "Jordan P.",
    lastMessage: "Who is bringing pucks?",
    updatedAt: todayAt(20, 15),
    unread: 5,
  },
];

// unread messages icon (yellow circle with black number)
function UnreadMessagesIcon({ count }: { count: number }) {
  return (
    <View className="min-h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2">
      <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
        {count}
      </Text>
    </View>
  );
}

// channel card for "Admins" and "Team"
function ChannelCard({ channel }: { channel: Channel }) {
  const time = formatChatTime(channel.updatedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        `${channel.name} channel. ` +
        `Last message from ${channel.lastSender} at ${time}: ${channel.lastMessage}` +
        (channel.unread > 0 ? `. ${channel.unread} unread` : "")
      }
      onPress={() => {
        // TODO: navigate to the chosen channel
      }}
      className="w-full flex-row items-start gap-3.5 rounded-lg bg-[#2E2E2E] p-4 active:opacity-80"
    >
      {/* channel icon */}
      <View className="h-[52px] w-[52px] items-center justify-center rounded-lg bg-brand">
        <Text className="font-sans text-[28px] leading-[30px] text-on-brand">
          #
        </Text>
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        {/* channel header */}
        <View className="flex-row items-baseline justify-between gap-3">
          <Text
            numberOfLines={1}
            className="flex-1 font-sans-bold text-[21px] leading-[30px] text-white"
          >
            {channel.name}
          </Text>
          <Text className="font-sans text-[18px] leading-[26px] text-ink-muted-dark">
            {time}
          </Text>
        </View>

        {/* channel details */}
        <View className="flex-row items-center gap-2 pt-0.5">
          <Text
            numberOfLines={2}
            className="flex-1 font-sans text-[18px] leading-[26px] text-white"
          >
            <Text className="font-sans-bold">{channel.lastSender}:</Text>{" "}
            {channel.lastMessage}
          </Text>
          {channel.unread > 0 && <UnreadMessagesIcon count={channel.unread} />}
        </View>
      </View>
    </Pressable>
  );
}

// header to switch between "Channels" or "Messages" tabs
function SectionTab({
  label,
  active,
  unread,
  onPress,
}: {
  label: string;
  active: boolean;
  unread?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        unread
          ? `${label}, ${unread} unread ${unread === 1 ? "conversation" : "conversations"}`
          : label
      }
      onPress={onPress}
      className={`min-h-[52px] flex-1 flex-row items-center justify-center gap-2 border-b-4 ${
        active ? "border-brand" : "border-transparent"
      }`}
    >
      <Text
        className={`text-[18px] leading-[26px] ${
          active ? "font-sans-bold text-white" : "font-sans text-ink-muted-dark"
        }`}
      >
        {label}
      </Text>
      {!!unread && <UnreadMessagesIcon count={unread} />}
    </Pressable>
  );
}

// channels tab when the user isn't on any team
function NoTeamState() {
  return (
    <ScrollView contentContainerClassName="grow items-center justify-center p-5">
      <Text
        accessibilityRole="header"
        className="text-center font-sans-bold text-[26px] leading-[34px] text-white"
      >
        You haven’t joined a team yet
      </Text>
      <Text className="max-w-[340px] py-3 text-center font-sans text-[18px] leading-[26px] text-[#D9D9D9]">
        When you join a team, your team chat will show up here. You can message
        your coach and teammates.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/tabs/teams/find")}
        className="min-h-14 w-full items-center justify-center rounded bg-brand px-1.5 active:opacity-80"
      >
        <Text className="text-center font-sans-bold text-[20px] text-on-brand">
          Find a team
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// chat screen
export default function ChatsScreen() {
  const [section, setSection] = useState<Section>("channels");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  const headerRef = useRef<ComponentRef<typeof View>>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  const [profile, setProfile] = useState<Pick<
    UserProfile,
    "userId" | "role"
  > | null>(null);

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isError: isTeamsError,
  } = useQuery<TeamOption[]>({
    queryKey: ["chatTeams", profile?.userId],
    enabled: profile !== null,
    queryFn: async () => {
      if (!profile) {
        throw new Error("User profile is not available.");
      }

      const teamIds = await getUsersTeams(profile.userId);
      return fetchTeamOptions(
        teamIds.map((id) => id.toString()),
        profile.role,
      );
    },
  });

  const team =
    teams.find((option) => option.id === selectedTeamId) ?? teams[0];

  useEffect(() => {
    const loadUserProfile = async () => {
      // check if there is a user currently logged in
      const uid = auth.currentUser?.uid;
      if (!uid) {
        router.replace("/auth/login");
        return;
      }
      try {
        const userProfile = await getUserProfile(uid);
        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        Alert.alert(
          "Unable to load profile",
          error instanceof Error ? error.message : "Please try again.",
        );
      }
    };

    void loadUserProfile();
  }, []);

  const channels = useMemo(
    () =>
      CHANNELS.filter(
        (c) => (profile !== null && isUserStaff(profile.role)) || c.id === "admins",
      ).sort(byMostRecent),
    [profile],
  );
  const conversations = useMemo(
    () => [...CONVERSATIONS].sort(byMostRecent),
    [],
  );

  const emptyState = (message: string) =>
    LOADING ? (
      <ActivityIndicator
        accessibilityLabel="Loading chats"
        color="#FFD101"
        size="large"
        className="pt-10"
      />
    ) : (
      <Text className="pt-10 text-center font-sans text-[18px] leading-[26px] text-ink-muted-dark">
        {message}
      </Text>
    );

  const openSwitcher = () => {
    headerRef.current?.measureInWindow((_x, y, _w, h) => {
      setHeaderBottom(y + h);
      setDropdownOpen(true);
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      {/* header */}
      <View
        ref={headerRef}
        className="flex-row items-center justify-between pb-1 pl-6 pr-3 pt-5"
      >
        {team ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${dropdownOpen ? "Close" : "Switch"} team. Current team: ${team.name}`}
            accessibilityState={{ expanded: dropdownOpen }}
            onPress={dropdownOpen ? () => setDropdownOpen(false) : openSwitcher}
            className="min-h-12 shrink flex-row items-center gap-1.5"
          >
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              className="shrink font-sans-bold text-[26px] leading-[34px] text-white"
            >
              {team.name}
            </Text>
            <Ionicons
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color="#FFFFFF"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        ) : (
          // not on a team: plain title, no team switcher
          <View className="min-h-12 shrink justify-center">
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              className="font-sans-bold text-[26px] leading-[34px] text-white"
            >
              My chat
            </Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notification settings"
          className="h-12 w-12 items-center justify-center rounded-lg"
        >
          <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Channels / Messages section tabs */}
      <View
        accessibilityRole="tablist"
        className="mt-2 flex-row border-b border-[#2B2B2B]"
      >
        <SectionTab
          label="Channels"
          active={section === "channels"}
          onPress={() => setSection("channels")}
        />
        <SectionTab
          label="Messages"
          unread={conversations.filter((c) => c.unread > 0).length}
          active={section === "messages"}
          onPress={() => setSection("messages")}
        />
      </View>

      {/* display which section the user is in accordingly */}
      {section === "channels" && !team ? (
        <NoTeamState />
      ) : section === "channels" ? (
        <FlatList
          data={LOADING ? [] : channels}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ChannelCard channel={item} />}
          contentContainerClassName="gap-3 p-5"
          ListEmptyComponent={emptyState("No channels yet")}
        />
      ) : (
        <FlatList
          data={LOADING ? [] : conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <MessageRow conversation={item} />}
          contentContainerClassName="px-5 pb-5"
          ListEmptyComponent={emptyState("No messages yet")}
          ListHeaderComponent={
            <View className="pb-2 pt-4">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  router.push("/chat/new_message");
                }}
                className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-lg bg-brand active:opacity-80"
              >
                <View aria-hidden>
                  <NewMessageIcon width={24} height={24} />
                </View>
                <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
                  New message
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      {dropdownOpen && team && (
        <TeamDropdown
          visible={dropdownOpen}
          top={headerBottom}
          teams={teams}
          selectedId={team.id}
          onSelect={(id) => {
            setSelectedTeamId(id);
            setDropdownOpen(false);
          }}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
