import { Role } from "@/types";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentRef, useEffect, useRef } from "react";
import { Pressable, View, Text, AccessibilityInfo } from "react-native";

type ShortUserInfo = {
  userId: string;
  username: string;
  role: Role;
};

function isUserStaff(user: ShortUserInfo): boolean{
    return !(user.role === "player" || user.role === "contact");
}

// for the member's avatar logo
function initials(name: string) {
  const words = name.replace(/\./g, '').trim().split(/\s+/);
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
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
        blocked ? 'border-danger-dark bg-[#2A1210]' : 'border-brand bg-brand-soft-dark'
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
          isUserStaff(member) ? 'bg-brand' : 'bg-white'
        }`}
      >
        <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
          {initials(member.username)}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-[18px] leading-[26px] text-white">{member.username}</Text>
        <Text className="font-sans text-[18px] leading-[26px] text-ink-muted-dark">{member.role}</Text>
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
const BLOCKED_TITLE = 'Not allowed: player-to-player message';
const BLOCKED_MESSAGE =
  'Players can’t message another player one-on-one. Add a coach or staff member to start a group message.';

// alert component if a user tries to start a chat with only other players
function BlockedAlert() {
  const ref = useRef<ComponentRef<typeof View>>(null);

  // move screenreader focus to the alert so it's read right away
  // the delay lets VoiceOver finish reacting to the button press first
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
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
      <Ionicons name="ban-outline" size={26} color="#FF8A80" style={{ marginTop: 1 }} />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans-bold text-[18px] leading-[26px] text-danger-dark">{BLOCKED_TITLE}</Text>
        <Text className="font-sans text-[18px] leading-[26px] text-white">{BLOCKED_MESSAGE}</Text>
      </View>
    </View>
  );
}

// navigate to this page with a custom router field: teamId