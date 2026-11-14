import { Modal, Pressable, Text, View } from 'react-native';

export type TeamOption = {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  unread: number;
};

type TeamDropdownProps = {
  visible: boolean;
  top: number;
  teams: TeamOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

// for the team's logo in the dropdown
function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// dropdown listing the user's teams
export default function TeamDropdown({ visible, top, teams, selectedId, onSelect, onClose }: TeamDropdownProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // Android back button (required prop on Modal by Android)
    >
      <View className="flex-1">
        {/* clear area over the header so that tapping the team name again closes it (modal covers the screen) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close team list"
          onPress={onClose}
          style={{ height: top }}
        />

        {/* dim area below the header (tapping it closes it), with the dropdown inside */}
        <Pressable
          accessible={false}
          onPress={onClose}
          className="flex-1 bg-black/[0.72] px-4 pt-2"
        >
          {/* dropdown view: swallows taps so pressing the panel doesn't close it */}
          <Pressable
            accessible={false}
            onPress={() => {}}
            className="gap-1 rounded-lg border-2 border-line bg-surface-alt-dark p-2"
          >
          <Text accessibilityRole="header" className="px-2 py-1 font-sans-bold text-[18px] leading-6 text-ink-muted-dark">
            Your teams
          </Text>

          {/* display all of the user's teams in the dropdown */}
          {teams.map((team) => {
            const selected = team.id === selectedId;
            return (
              <Pressable
                key={team.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  `${team.name}, ${team.role}, ${team.memberCount} members` +
                  (team.unread ? `, ${team.unread} unread` : '')
                }
                onPress={() => onSelect(team.id)}
                className={`min-h-[72px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 ${
                  selected ? 'border-brand bg-brand-soft-dark' : 'border-transparent'
                }`}
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-lg ${
                    selected ? 'bg-brand' : 'bg-white'
                  }`}
                >
                  <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">
                    {initials(team.name)}
                  </Text>
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="font-sans-bold text-[18px] leading-[26px] text-white">{team.name}</Text>
                  <Text className="font-sans text-[18px] leading-[26px] text-ink-muted-dark">
                    {team.role} · {team.memberCount} members
                  </Text>
                </View>

                {team.unread > 0 && (
                  <View className="min-h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2">
                    <Text className="font-sans-bold text-[18px] leading-[26px] text-on-brand">{team.unread}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
