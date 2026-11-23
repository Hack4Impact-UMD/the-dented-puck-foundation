import { Pressable, Text, View } from 'react-native';
import HashIcon from '@/assets/icons/hash.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { CountBadge } from '@/components/ui/CountBadge';
import { colors } from '@/components/ui/tokens';

type Props = ScreenReaderControlProps & {
  /** Channel name without the "#", for example "Admins". */
  name: string;
  /** Time of the last message, for example "9:41 PM". */
  time?: string;
  /** Who sent the last message, shown in bold before it. */
  lastSender?: string;
  lastMessage?: string;
  unread?: number;
  onPress: () => void;
};

/** A team channel in the Channels tab (Figma 7100): # tile, name, time, last message and unread count. */
export function ChannelCard({
  name,
  time,
  lastSender,
  lastMessage,
  unread = 0,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const spoken = [
    `${name} channel`,
    unread ? `${unread} unread` : null,
    lastMessage ? `${lastSender ? `${lastSender}: ` : ''}${lastMessage}` : null,
    time,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? spoken}
      accessibilityHint={screenReaderHint}
      className="flex-row items-start gap-3.5 rounded-lg bg-surface-card p-4 active:opacity-80"
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-lg bg-brand">
        <HashIcon width={26} height={26} color={colors.black} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text className="shrink font-sans-bold text-h3 text-white">{name}</Text>
          {time ? <Text className="font-sans text-body text-ink-muted-dark">{time}</Text> : null}
        </View>
        {lastMessage || unread > 0 ? (
          <View className="flex-row items-center gap-2">
            {lastMessage ? (
              <Text numberOfLines={2} className="flex-1 font-sans text-body text-white">
                {lastSender ? <Text className="font-sans-bold">{lastSender}: </Text> : null}
                {lastMessage}
              </Text>
            ) : (
              <View className="flex-1" />
            )}
            <CountBadge count={unread} hideFromScreenReader />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
