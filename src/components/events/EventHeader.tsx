import { Text, View } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { getInitials } from './eventFormat';
import { TeamRelationship } from './TeamRelationship';

/** Spoken text for each stop in an `EventHeader`. */
export type EventHeaderScreenReaderParts = {
  /** The event title heading. Defaults to `title`. */
  title?: ScreenReaderStopText;
  /** The team name. Defaults to `teamName`. */
  team?: ScreenReaderStopText;
  /**
   * The Follow / Following button, or the membership label. Defaults: label "Follow {team}" /
   * "Following {team}"; press announcement is the label it switches to.
   */
  follow?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  title: string;
  teamName: string;
  followed: boolean;
  onToggleFollow: () => void;
  // Set when the viewer already belongs to the team; shows a status label instead of Follow.
  membership?: 'requested' | 'joined' | 'coach';
  screenReaderParts?: EventHeaderScreenReaderParts;
};

// Reading order: title, team, Follow (or the membership status).
export function EventHeader({
  title,
  teamName,
  followed,
  onToggleFollow,
  membership,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const follow = screenReaderParts?.follow;

  return (
    <View {...screenReaderProps} className="gap-2.5 border-b border-line bg-surface-alt-dark px-4 pb-6 pt-7">
      {/* One stop for the whole title: on web a reader otherwise steps through a wrapped title line by line. */}
      <View accessible accessibilityRole="header" accessibilityLabel={screenReaderParts?.title?.label ?? title}>
        <Text aria-hidden className="font-sans-bold text-h1 text-white">
          {title}
        </Text>
      </View>

      <View className="flex-row items-center gap-2.5">
        {/* Decorative badge; the team name beside it is what gets read. */}
        <View
          accessible={false}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-10 w-10 items-center justify-center rounded-full bg-brand"
        >
          <Text className="font-sans-bold text-small text-on-brand">{getInitials(teamName)}</Text>
        </View>
        <Text
          accessibilityLabel={screenReaderParts?.team?.label ?? teamName}
          accessibilityRole="text"
          className="flex-1 font-sans text-lg text-white"
        >
          {teamName}
        </Text>

        <TeamRelationship
          state={membership ?? (followed ? 'following' : 'not-following')}
          teamName={teamName}
          onToggleFollow={onToggleFollow}
          screenReaderLabel={follow?.label}
          screenReaderHint={follow?.hint}
          screenReaderPressAnnouncement={follow?.pressAnnouncement}
          hideFromScreenReader={hideFromScreenReader}
        />
      </View>
    </View>
  );
}
