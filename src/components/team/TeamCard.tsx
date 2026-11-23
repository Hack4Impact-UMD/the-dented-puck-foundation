import { Text, View } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';
import AppButton from './AppButton';

export type TeamCardScreenReaderParts = {
  /** The team summary. Default: "{name}, {ages}, {city}". */
  summary?: ScreenReaderStopText;
  /** The Follow / Followed button. Default label: "Follow {name}" / "Following {name}". */
  follow?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  name: string;
  /** For example "Ages 12 to 40" or "All ages". */
  ages: string;
  city: string;
  following: boolean;
  onToggleFollow: () => void;
  screenReaderParts?: TeamCardScreenReaderParts;
};

/**
 * Team tile for the two-column grids (Figma 6200 Teams Nearby, 6600 See All Teams): avatar,
 * name, ages, city and a Follow / Followed button. Two reading stops: the summary, then the button.
 */
export function TeamCard({ name, ages, city, following, onToggleFollow, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const follow = screenReaderParts?.follow;

  return (
    <View {...screenReaderProps} className="flex-1 items-center gap-[15px] rounded bg-surface-card p-[15px]">
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={screenReaderParts?.summary?.label ?? `${name}, ${ages}, ${city}`}
        className="items-center gap-2.5"
      >
        <Avatar name={name} size={60} />
        <View className="items-center">
          <Text className="text-center font-sans-bold text-h3 text-white">{name}</Text>
          <Text className="text-center font-sans text-[18px] leading-[27px] text-white">{ages}</Text>
          <Text className="text-center font-sans text-[18px] text-ink-quiet">{city}</Text>
        </View>
      </View>
      <AppButton
        title={following ? 'Followed' : 'Follow'}
        onPress={onToggleFollow}
        variant={following ? 'outline' : 'secondary'}
        className="w-full"
        accessibilityState={{ selected: following }}
        screenReaderLabel={follow?.label ?? `${following ? 'Following' : 'Follow'} ${name}`}
        screenReaderHint={follow?.hint}
        screenReaderPressAnnouncement={follow?.pressAnnouncement ?? `${following ? 'Unfollowed' : 'Following'} ${name}`}
        hideFromScreenReader={hideFromScreenReader}
      />
    </View>
  );
}
