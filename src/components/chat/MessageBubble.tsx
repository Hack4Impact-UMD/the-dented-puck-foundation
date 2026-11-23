import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { Avatar } from '@/components/ui/Avatar';

type Props = ScreenReaderStopProps & {
  text: string;
  time: string;
  /** `outgoing`: yellow, on the right. `incoming`: dark grey, on the left with the sender's avatar. */
  direction: 'incoming' | 'outgoing';
  /** Incoming only; used for the avatar and the spoken label. */
  sender?: string;
  avatarTone?: 'brand' | 'light';
};

/** One message in a direct conversation (Figma 7220). Read as "{sender or You}: {text}, {time}". */
export function MessageBubble({ text, time, direction, sender, avatarTone = 'light', screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const outgoing = direction === 'outgoing';

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? `${outgoing ? 'You' : (sender ?? 'Them')}: ${text}, ${time}`}
      className={`flex-row items-end gap-2 ${outgoing ? 'justify-end' : ''}`}
    >
      {!outgoing && sender ? (
        <View className="pb-[26px]">
          <Avatar name={sender} size={36} tone={avatarTone} />
        </View>
      ) : null}
      <View className={`max-w-[250px] gap-0.5 ${outgoing ? 'items-end' : 'items-start'}`}>
        <View
          className={`px-3.5 py-2.5 ${
            outgoing
              ? 'rounded-bl-2xl rounded-br rounded-tl-2xl rounded-tr-2xl bg-brand'
              : 'rounded-bl rounded-br-2xl rounded-tl-2xl rounded-tr-2xl border border-line-faint bg-surface-alt-dark'
          }`}
        >
          <Text className={`font-sans text-body ${outgoing ? 'text-on-brand' : 'text-white'}`}>{text}</Text>
        </View>
        <Text className="font-sans text-body text-ink-muted-dark">{time}</Text>
      </View>
    </View>
  );
}
