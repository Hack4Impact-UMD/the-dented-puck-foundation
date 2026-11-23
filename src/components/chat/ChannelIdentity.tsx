import { Text, View } from 'react-native';
import HashIcon from '@/assets/icons/hash.svg';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { colors } from '@/components/ui/tokens';

type Props = ScreenReaderStopProps & {
  /** Channel name without "#". */
  name: string;
  /** For example "Team Name · 18 members". */
  detail?: string;
};

/** Channel name block at the top of Channel info (Figma 7310): # tile, name and member count. */
export function ChannelIdentity({ name, detail, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="header"
      accessibilityLabel={screenReaderLabel ?? [`${name} channel`, detail].filter(Boolean).join(', ')}
      className="flex-row items-center gap-3.5"
    >
      <View className="h-14 w-14 items-center justify-center rounded-lg bg-brand">
        <HashIcon width={28} height={28} color={colors.black} />
      </View>
      <View className="flex-1">
        <Text className="font-sans-bold text-h2 text-white">{name}</Text>
        {detail ? <Text className="font-sans text-body text-ink-muted-dark">{detail}</Text> : null}
      </View>
    </View>
  );
}
