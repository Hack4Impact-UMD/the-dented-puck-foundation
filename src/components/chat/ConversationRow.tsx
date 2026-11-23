import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/CountBadge';

type Props = ScreenReaderControlProps & {
  /** Person or people, for example "Taylor M., Morgan K.". */
  name: string;
  /** Yellow for coaches and staff, white for players. */
  avatarTone?: 'brand' | 'light';
  /** Avatar initials when `name` lists several people. */
  initials?: string;
  time: string;
  lastMessage: string;
  /** Unread conversations show the message in bold white with a count. */
  unread?: number;
  onPress: () => void;
};

/** A direct or group conversation in the Messages tab (Figma 7200). */
export function ConversationRow({
  name,
  avatarTone = 'light',
  initials,
  time,
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
  const spoken = [name, unread ? `${unread} unread` : null, lastMessage, time].filter(Boolean).join(', ');

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? spoken}
      accessibilityHint={screenReaderHint}
      className="flex-row items-center gap-3.5 border-b border-line-faint py-3.5 active:opacity-80"
    >
      <Avatar name={name} initials={initials} size={52} tone={avatarTone} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row justify-between gap-2">
          <Text numberOfLines={1} className="shrink font-sans-bold text-body text-white">
            {name}
          </Text>
          <Text className="font-sans text-body text-ink-muted-dark">{time}</Text>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className={`shrink text-body ${unread ? 'font-sans-bold text-white' : 'font-sans text-ink-muted-dark'}`}>
            {lastMessage}
          </Text>
          <CountBadge count={unread} hideFromScreenReader />
        </View>
      </View>
    </Pressable>
  );
}
