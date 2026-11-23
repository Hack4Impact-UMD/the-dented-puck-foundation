import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/CountBadge';

export type TeamSwitcherTeam = {
  id: string;
  name: string;
  /** Tile text; default: initials of `name`. */
  initials?: string;
  /** For example "Coach" or "Player". */
  role: string;
  memberCount: number;
  unread?: number;
};

type Props = ScreenReaderProps & {
  teams: TeamSwitcherTeam[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Default "Your teams". */
  heading?: string;
};

/**
 * Drop-down list of the user's teams under the chat title (Figma 7110). The current team has a
 * yellow outline and tile. Each team is a radio button read as "{name}, {role}, {n} members, {n} unread".
 * Render it in an overlay just below `ChatListHeader`.
 */
export function TeamSwitcherMenu({ teams, selectedId, onSelect, heading = 'Your teams', hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} accessibilityRole="radiogroup" className="gap-1 rounded-lg border-2 border-line bg-surface-alt-dark p-2">
      <Text accessibilityRole="header" className="px-2 py-1 font-sans-bold text-label text-ink-muted-dark">
        {heading}
      </Text>
      {teams.map((team) => {
        const selected = team.id === selectedId;
        const meta = `${team.role} · ${team.memberCount} members`;
        return (
          <Pressable
            key={team.id}
            {...skipFocusProps(hideFromScreenReader)}
            onPress={() => onSelect(team.id)}
            accessibilityRole="radio"
            accessibilityLabel={[team.name, team.role, `${team.memberCount} members`, team.unread ? `${team.unread} unread` : null]
              .filter(Boolean)
              .join(', ')}
            accessibilityState={{ checked: selected }}
            className={`min-h-[72px] flex-row items-center gap-3 rounded-lg border-2 px-3 py-2 active:opacity-80 ${
              selected ? 'border-brand bg-brand-soft-dark' : 'border-transparent'
            }`}
          >
            <Avatar name={team.name} initials={team.initials} size={44} shape="rounded" tone={selected ? 'brand' : 'light'} />
            <View className="flex-1">
              <Text className="font-sans-bold text-body text-white">{team.name}</Text>
              <Text className="font-sans text-body text-ink-muted-dark">{meta}</Text>
            </View>
            {team.unread ? <CountBadge count={team.unread} hideFromScreenReader /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
