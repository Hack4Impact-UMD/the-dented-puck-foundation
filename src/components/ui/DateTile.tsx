import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  /** Short month, for example "Nov". */
  month: string;
  /** Day of the month, for example "21". */
  day: string;
  /** `card`: grey tile on a black screen (event details). `black`: black tile inside a grey card (event cards). */
  tone?: 'card' | 'black';
};

/**
 * 56 × 92 tile with a yellow month and day. Decorative by default because the text next to it
 * gives the full date; pass `hideFromScreenReader={false}` to make it a stop.
 */
export function DateTile({ month, day, tone = 'card', screenReaderLabel, hideFromScreenReader = true, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible={!hideFromScreenReader}
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? `${month} ${day}`}
      className={`min-h-[92px] w-14 items-center justify-center rounded py-1.5 ${tone === 'card' ? 'bg-surface-card' : 'bg-black'}`}
    >
      <Text className="font-sans-bold text-lg text-brand">{month}</Text>
      <Text className="font-sans-bold text-[32px] leading-10 text-brand">{day}</Text>
    </View>
  );
}
