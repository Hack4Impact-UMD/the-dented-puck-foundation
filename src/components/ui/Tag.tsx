import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  label: string;
  /** `default`: team initials on event cards (12 px sides). `compact`: role next to a chat name (8 px sides). */
  size?: 'default' | 'compact';
};

/** Figma "Tag": bold yellow text in a thin yellow outline, for example "BB" or "Coach". */
export function Tag({ label, size = 'default', screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? label}
      className={`self-start rounded border border-brand bg-brand-soft-dark ${size === 'compact' ? 'px-2' : 'px-3 py-[5px]'}`}
    >
      <Text className={`font-sans-bold text-brand ${size === 'compact' ? 'text-body' : 'text-label'}`}>{label}</Text>
    </View>
  );
}
