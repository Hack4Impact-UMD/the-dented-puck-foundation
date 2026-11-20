import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, SectionList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { router } from 'expo-router';

// establish coach/staff or player chat roles
type Member = {
  id: string;
  name: string;
  role: string;
  isStaff: boolean;
};

// PLACEHOLDER for other team members / players
const MEMBERS: Member[] = [
  { id: 'cr', name: 'Coach Riley', role: 'Coach', isStaff: true },
  { id: 'pl', name: 'Pat L.', role: 'Team manager', isStaff: true },
  { id: 'jp', name: 'Jordan P.', role: 'Player', isStaff: false },
  { id: 'tm', name: 'Taylor M.', role: 'Player', isStaff: false },
  { id: 'mk', name: 'Morgan K.', role: 'Player', isStaff: false },
];

// PLACEHOLDER until auth provides the current user's role
const CURRENT_USER_IS_STAFF = false;

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
  member: Member;
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
        {member.name} · {member.role}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${member.name}`}
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
  member: Member;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${member.name}, ${member.role}`}
      onPress={onToggle}
      className="min-h-16 flex-row items-center gap-3.5 border-b border-[#2B2B2B] py-2"
    >
      {/* member avatar logo is yellow for coach/staff and whtie for players */}
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          member.isStaff ? 'bg-brand' : 'bg-white'
        }`}
      >
        <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
          {initials(member.name)}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-[18px] leading-[26px] text-white">{member.name}</Text>
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

// new message screen
export default function NewMessageScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    setShowBlocked(false);
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  };

  const selected = MEMBERS.filter((m) => selectedIds.includes(m.id));

  // players may only message other players when a coach/staff member is included in the chat
  const blocked = !CURRENT_USER_IS_STAFF && selected.length > 0 && !selected.some((m) => m.isStaff);
  const canStartConversation = selected.length > 0 && !showBlocked;

  const handleStartConversation = () => {
    if (blocked) {
      setShowBlocked(true);
      return;
    }
    // TODO: Start conversation button functionality
  };

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = MEMBERS.filter((m) => m.name.toLowerCase().includes(q));
    return [
      { title: 'Coaches and staff', data: matches.filter((m) => m.isStaff) },
      { title: 'Players', data: matches.filter((m) => !m.isStaff) },
    ].filter((s) => s.data.length > 0);
  }, [search]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-black">
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
            <Text className="font-sans-bold text-[18px] leading-[26px] text-white">Cancel</Text>
          </Pressable>
        </View>
        <Text accessibilityRole="header" className="font-sans-bold text-[21px] leading-[30px] text-white">
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}
        ListHeaderComponent={
          <View className="gap-5 pb-5">
            {selected.length > 0 && (
              <View className="gap-2">
                <Text className="font-sans-bold text-[18px] leading-[26px] text-white">To</Text>
                {selected.map((m) => (
                  <RecipientCard key={m.id} member={m} blocked={showBlocked && !m.isStaff} onRemove={() => toggle(m.id)} />
                ))}
              </View>
            )}

            <View className="gap-2">
              <Text className="font-sans-bold text-[18px] leading-[26px] text-white">
                {selected.length > 0 ? 'Add more people' : 'Add people'}
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
          <MemberRow member={item} selected={selectedIds.includes(item.id)} onToggle={() => toggle(item.id)} />
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
            canStartConversation ? 'bg-brand active:opacity-80' : 'border-2 border-line bg-surface-alt-dark'
          }`}
        >
          <Text
            className={`font-sans-bold text-[18px] leading-[26px] ${
              canStartConversation ? 'text-on-brand' : 'text-ink-muted-dark'
            }`}
          >
            Start conversation
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
