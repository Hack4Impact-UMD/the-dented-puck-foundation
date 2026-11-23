import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';

type Props = ScreenReaderStopProps & {
  sender: string;
  text: string;
  time: string;
  /** Shown as a yellow tag after the name, for example "Coach". */
  role?: string;
  avatarTone?: 'brand' | 'light';
};

/** One message in a team channel (Figma 7300): avatar, name, role tag, time and text. */
export function ChannelMessage({ sender, text, time, role, avatarTone = 'light', screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? `${[sender, role].filter(Boolean).join(', ')}: ${text}, ${time}`}
      className="flex-row items-start gap-3"
    >
      <Avatar name={sender} size={44} tone={avatarTone} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="font-sans-bold text-body text-white">{sender}</Text>
          {role ? <Tag label={role} size="compact" hideFromScreenReader /> : null}
          <Text className="font-sans text-body text-ink-muted-dark">{time}</Text>
        </View>
        <Text className="font-sans text-body text-white">{text}</Text>
      </View>
    </View>
  );
}
