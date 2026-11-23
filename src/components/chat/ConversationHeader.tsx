import { Text, View } from 'react-native';
import HashIcon from '@/assets/icons/hash.svg';
import InfoIcon from '@/assets/icons/info.svg';
import {
  useScreenReaderProps,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors } from '@/components/ui/tokens';

export type ConversationHeaderScreenReaderParts = {
  /** Default label: "Back". */
  back?: ScreenReaderControlText;
  /** The name and subtitle. Default: "{title}, {subtitle}". */
  title?: ScreenReaderStopText;
  /** Default label: "Conversation info" (or "Channel info" for channels). */
  info?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  /** Person's name, or channel name without "#". */
  title: string;
  /** "Coach", or "Team Name · 18 members" for a channel. */
  subtitle?: string;
  /** `channel` shows the yellow # tile instead of an avatar. */
  kind?: 'person' | 'channel';
  avatarTone?: 'brand' | 'light';
  onBack: () => void;
  onInfo?: () => void;
  screenReaderParts?: ConversationHeaderScreenReaderParts;
};

/** Top bar of a conversation or channel (Figma 7220, 7300): back, avatar or # tile, name and subtitle, info. */
export function ConversationHeader({
  title,
  subtitle,
  kind = 'person',
  avatarTone = 'light',
  onBack,
  onInfo,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const back = screenReaderParts?.back;
  const info = screenReaderParts?.info;

  return (
    <View {...screenReaderProps}>
      <ScreenHeader
        titleAlign="start"
        divider="subtle"
        hideFromScreenReader={hideFromScreenReader}
        leading={{ kind: 'back', onPress: onBack, ...back }}
        trailing={
          onInfo
            ? { kind: 'icon', icon: InfoIcon, iconSize: 26, label: kind === 'channel' ? 'Channel info' : 'Conversation info', onPress: onInfo, ...info }
            : undefined
        }
      >
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={screenReaderParts?.title?.label ?? [title, subtitle].filter(Boolean).join(', ')}
          className="flex-row items-center gap-2"
        >
          {kind === 'channel' ? (
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand">
              <HashIcon width={22} height={22} color={colors.black} />
            </View>
          ) : (
            <Avatar name={title} size={40} tone={avatarTone} />
          )}
          <View className="flex-1">
            <Text numberOfLines={1} className="font-sans-bold text-[21px] leading-7 text-white">
              {title}
            </Text>
            {subtitle ? <Text numberOfLines={1} className="font-sans text-body text-ink-muted-dark">{subtitle}</Text> : null}
          </View>
        </View>
      </ScreenHeader>
    </View>
  );
}

