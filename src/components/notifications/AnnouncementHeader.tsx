import { Text, View, type ImageSourcePropType } from 'react-native';
import {
  useScreenReaderProps,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';

export type AnnouncementHeaderScreenReaderParts = {
  title?: ScreenReaderStopText;
  /** Default: "From {sender}, to {recipients}, {sentAt}". */
  sender?: ScreenReaderStopText;
};

type Props = ScreenReaderProps & {
  title: string;
  sender: string;
  /** For example "Baltimore Blades"; shown as "To Baltimore Blades". */
  recipients: string;
  /** For example "Oct 28 at 4:12 pm". */
  sentAt: string;
  senderPhoto?: ImageSourcePropType;
  screenReaderParts?: AnnouncementHeaderScreenReaderParts;
};

/** Title and sender block at the top of a notification (Figma 6900). Two stops: title, sender. */
export function AnnouncementHeader({
  title,
  sender,
  recipients,
  sentAt,
  senderPhoto,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="gap-4">
      <Text accessibilityRole="header" accessibilityLabel={screenReaderParts?.title?.label} className="font-sans-bold text-h2 text-white">
        {title}
      </Text>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={screenReaderParts?.sender?.label ?? `From ${sender}, to ${recipients}, ${sentAt}`}
        className="flex-row items-center gap-4"
      >
        <Avatar name={sender} source={senderPhoto} size={60} ring={Boolean(senderPhoto)} />
        <View className="flex-1">
          <Text className="font-sans-bold text-h3 text-white">{sender}</Text>
          <Text className="font-sans text-body-lg text-ink-quiet">To {recipients}</Text>
          <Text className="font-sans text-small text-ink-quiet">{sentAt}</Text>
        </View>
      </View>
    </View>
  );
}
