import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  count: number;
};

/** Yellow pill with an unread count (chat tabs, channels, conversations, team switcher). Nothing renders at 0. */
export function CountBadge({ count, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({
    hideFromScreenReader,
    screenReaderOrder: count > 0 ? screenReaderOrder : undefined,
  });
  if (count <= 0) return null;

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? `${count} unread`}
      className="h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2"
    >
      <Text className="font-sans-bold text-body text-on-brand">{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
