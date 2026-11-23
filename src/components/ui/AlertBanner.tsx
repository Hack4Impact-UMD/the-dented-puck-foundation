import { Text, View } from 'react-native';
import BanIcon from '@/assets/icons/ban.svg';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { colors } from './tokens';

type Props = ScreenReaderStopProps & {
  title: string;
  message?: string;
};

/**
 * Red banner for an action that isn't allowed (Figma 7211: "Not allowed: player-to-player
 * message"). One reading stop that reads the title and message. For a form error after
 * submitting, use `AuthErrorBanner`.
 */
export function AlertBanner({ title, message, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={screenReaderLabel ?? [title, message].filter(Boolean).join('. ')}
      className="flex-row items-start gap-3 rounded-lg border-2 border-danger-dark bg-danger-soft px-4 py-3.5"
    >
      <View className="pt-px">
        <BanIcon width={26} height={26} color={colors.danger} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-sans-bold text-body text-danger-dark">{title}</Text>
        {message ? <Text className="font-sans text-body text-white">{message}</Text> : null}
      </View>
    </View>
  );
}
