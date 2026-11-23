import { Pressable, Text, View } from 'react-native';
import ChevronDownIcon from '@/assets/icons/chevron-down.svg';
import ChevronUpIcon from '@/assets/icons/chevron-up.svg';
import GearIcon from '@/assets/icons/gear.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { IconButton } from '@/components/ui/IconButton';
import { colors } from '@/components/ui/tokens';

export type ChatListHeaderScreenReaderParts = {
  /** The title. Default label: "Switch team. Current team: {title}" (or "Close team list…" when open). */
  title?: ScreenReaderControlText;
  /** The gear. Default label: "Notification settings". */
  settings?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  /** The current team's name, or "My chat" when the user has no team. */
  title: string;
  /** Makes the title a team switcher with a chevron. Leave off when there's nothing to switch to. */
  onTitlePress?: () => void;
  /** Whether the team list (`TeamSwitcherMenu`) is open. */
  expanded?: boolean;
  onSettingsPress: () => void;
  screenReaderParts?: ChatListHeaderScreenReaderParts;
};

/** Top of the Chats tab: team name (opens the team switcher) and the notification settings gear (Figma 7100–7130). */
export function ChatListHeader({ title, onTitlePress, expanded = false, onSettingsPress, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const titleText = screenReaderParts?.title;
  const settings = screenReaderParts?.settings;
  const heading = <Text className="font-sans-bold text-h2 text-white">{title}</Text>;

  return (
    <View {...screenReaderProps} className="flex-row items-center justify-between pb-1 pl-6 pr-3 pt-5">
      {onTitlePress ? (
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(onTitlePress, titleText?.pressAnnouncement)}
          accessibilityRole="button"
          accessibilityLabel={titleText?.label ?? `${expanded ? 'Close team list' : 'Switch team'}. Current team: ${title}`}
          accessibilityHint={titleText?.hint}
          accessibilityState={{ expanded }}
          className="min-h-12 flex-row items-center gap-1.5 active:opacity-70"
        >
          {heading}
          {expanded ? <ChevronUpIcon width={24} height={24} color={colors.white} /> : <ChevronDownIcon width={24} height={24} color={colors.white} />}
        </Pressable>
      ) : (
        <View accessible accessibilityRole="header" accessibilityLabel={titleText?.label} className="min-h-12 justify-center">
          {heading}
        </View>
      )}
      <IconButton
        icon={GearIcon}
        iconSize={26}
        label="Notification settings"
        onPress={onSettingsPress}
        screenReaderLabel={settings?.label}
        screenReaderHint={settings?.hint}
        screenReaderPressAnnouncement={settings?.pressAnnouncement}
        hideFromScreenReader={hideFromScreenReader}
      />
    </View>
  );
}
