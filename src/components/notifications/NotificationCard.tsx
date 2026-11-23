import { Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';

type Props = ScreenReaderControlProps & {
  /** Sender name or notification title, for example "Coach Seonasa" or "Schedule change". */
  title: string;
  /** Short date, for example "10/28". */
  date: string;
  body: string;
  /** Avatar: a photo, or initials from `avatarName` (a team name, for example). */
  avatarSource?: ImageSourcePropType;
  avatarName: string;
  /** "Announcement sent to {audience}" line for coach announcements. */
  audience?: string;
  /** Yellow outline. */
  unread?: boolean;
  onPress: () => void;
};

/**
 * One notification in the list (Figma 6700 Unread, 6800 Read): avatar, title, date, optional
 * "Announcement sent to …" line and the message. One button; unread ones say so first.
 */
export function NotificationCard({
  title,
  date,
  body,
  avatarSource,
  avatarName,
  audience,
  unread = false,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const spoken = [unread ? 'Unread' : null, title, audience ? `Announcement sent to ${audience}` : null, body, date]
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
      className={`flex-row items-center gap-[15px] rounded bg-surface-card p-2.5 active:opacity-80 ${unread ? 'border-2 border-brand' : 'border-2 border-transparent'}`}
    >
      <Avatar name={avatarName} source={avatarSource} size={60} ring={Boolean(avatarSource)} />
      <View className="flex-1 gap-1">
        <View>
          <View className="flex-row items-center gap-2.5">
            <Text className="flex-1 font-sans-bold text-h3 text-white">{title}</Text>
            <Text className="font-sans text-[18px] text-ink-quiet">{date}</Text>
          </View>
          {audience ? (
            <Text className="font-sans text-[18px] text-white">
              <Text className="font-sans-bold">Announcement</Text> sent to <Text className="font-sans-bold">{audience}</Text>
            </Text>
          ) : null}
        </View>
        <Text className="font-sans text-[18px] leading-[23px] text-white">{body}</Text>
      </View>
    </Pressable>
  );
}
