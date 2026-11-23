import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  /** For example "Today" or "Thursday". */
  label: string;
};

/** Grey pill that separates days in a conversation (Figma 7220, 7300). */
export function DateDivider({ label, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="items-center pb-1">
      <View accessible accessibilityRole="header" accessibilityLabel={screenReaderLabel ?? label} className="rounded-full bg-surface-alt-dark px-3">
        <Text className="font-sans text-body text-ink-muted-dark">{label}</Text>
      </View>
    </View>
  );
}
