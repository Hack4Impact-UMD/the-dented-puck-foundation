import { Pressable, Text, View } from 'react-native';
import CheckIcon from '@/assets/icons/check.svg';
import CheckCircleFilledIcon from '@/assets/icons/check-circle-filled.svg';
import ScheduleIcon from '@/assets/icons/schedule.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';

export type TeamRelationshipState = 'not-following' | 'following' | 'requested' | 'joined' | 'coach';

type Props = ScreenReaderControlProps & {
  state: TeamRelationshipState;
  teamName: string;
  onToggleFollow?: () => void;
};

const STATUS: Record<'requested' | 'joined' | 'coach', { label: string; spoken: string }> = {
  requested: { label: 'Requested', spoken: 'Join requested' },
  joined: { label: 'Joined', spoken: 'Joined' },
  coach: { label: 'Coach', spoken: 'Coach' },
};

const followLabel = (following: boolean, teamName: string) => `${following ? 'Following' : 'Follow'} ${teamName}`;

// Figma "Team relationship" (1465:999). Follow/Following is a toggle button; Requested, Joined and
// Coach are non-interactive status labels (leaving a team lives on the team page).
// screenReaderHint and screenReaderPressAnnouncement only apply to Follow/Following.
export function TeamRelationship({
  state,
  teamName,
  onToggleFollow,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  if (state === 'not-following' || state === 'following') {
    const following = state === 'following';
    const disabled = !onToggleFollow;
    return (
      <Pressable
        {...screenReaderProps}
        {...skipFocusProps(hideFromScreenReader)}
        // By default, speaks the state the press switches to ("Following Baltimore Blades").
        onPress={disabled ? undefined : withPressAnnouncement(onToggleFollow, screenReaderPressAnnouncement ?? followLabel(!following, teamName))}
        disabled={disabled || undefined}
        accessibilityRole="button"
        accessibilityLabel={screenReaderLabel ?? followLabel(following, teamName)}
        accessibilityHint={screenReaderHint}
        accessibilityState={disabled ? { selected: following, disabled } : { selected: following }}
        className={`min-h-14 flex-row items-center justify-center rounded active:opacity-70 ${
          following ? 'gap-2 border border-line bg-surface-card pl-4 pr-6' : 'bg-brand px-6'
        }`}
      >
        {following ? <CheckIcon width={24} height={24} /> : null}
        <Text className={`font-sans-bold text-[21px] leading-7 ${following ? 'text-white' : 'text-on-brand'}`}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    );
  }

  const { label, spoken } = STATUS[state];
  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? spoken}
      className="min-h-11 flex-row items-center justify-center gap-1.5"
    >
      {state === 'requested' ? (
        <ScheduleIcon width={24} height={24} />
      ) : (
        <CheckCircleFilledIcon width={24} height={24} />
      )}
      <Text className={`font-sans-bold text-small ${state === 'requested' ? 'text-ink-quiet' : 'text-white'}`}>
        {label}
      </Text>
    </View>
  );
}
