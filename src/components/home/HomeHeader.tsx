import { Image, Pressable, View } from 'react-native';
import BellFilledIcon from '@/assets/icons/bell-filled.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { colors } from '@/components/ui/tokens';

export type HomeHeaderScreenReaderParts = {
  /** The wordmark. Default: "The Dented Puck Foundation". */
  logo?: ScreenReaderStopText;
  /** The bell. Default label: "Notifications" or "Notifications, unread". */
  notifications?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  onNotificationsPress: () => void;
  /** Yellow ring and dot on the bell (Figma 6110). */
  hasUnread?: boolean;
  screenReaderParts?: HomeHeaderScreenReaderParts;
};

/** Top of the Home tab: the Dented Puck wordmark and the notifications bell (Figma 6100, 6110). */
export function HomeHeader({ onNotificationsPress, hasUnread = false, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const bell = screenReaderParts?.notifications;

  return (
    <View {...screenReaderProps} className="flex-row items-center justify-between px-4 pb-[13px]">
      <Image
        source={require('@/assets/images/brand/wordmark.png')}
        accessible
        accessibilityRole="image"
        accessibilityLabel={screenReaderParts?.logo?.label ?? 'The Dented Puck Foundation'}
        style={{ width: 99, height: 40 }}
        resizeMode="contain"
      />
      <Pressable
        {...skipFocusProps(hideFromScreenReader)}
        onPress={withPressAnnouncement(onNotificationsPress, bell?.pressAnnouncement)}
        accessibilityRole="button"
        accessibilityLabel={bell?.label ?? (hasUnread ? 'Notifications, unread' : 'Notifications')}
        accessibilityHint={bell?.hint}
        hitSlop={4}
        className="active:opacity-70"
      >
        <View className={`h-10 w-10 items-center justify-center rounded-full border-2 ${hasUnread ? 'border-brand' : 'border-white'}`}>
          <BellFilledIcon width={24} height={24} color={hasUnread ? colors.brand : colors.white} />
          {hasUnread ? <View className="absolute right-[7px] top-[9px] h-[9px] w-[9px] rounded-full border border-black bg-brand" /> : null}
        </View>
      </Pressable>
    </View>
  );
}
