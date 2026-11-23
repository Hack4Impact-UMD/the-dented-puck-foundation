import { Pressable, Text, View } from 'react-native';
import CloseSmallIcon from '@/assets/icons/close-small.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { colors } from './tokens';

type Props = ScreenReaderControlProps & {
  label: string;
  /** Shows the X button. */
  onRemove?: () => void;
  /** `error`: red outline, for a recipient that can't be messaged. */
  tone?: 'default' | 'error';
};

/**
 * A picked item with a remove button, for example a message recipient ("Jordan P. · Player").
 * The chip is one reading stop; its X is a button labeled "Remove {label}".
 * The screen-reader props apply to the X button.
 */
export function Chip({
  label,
  onRemove,
  tone = 'default',
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const error = tone === 'error';

  return (
    <View
      {...screenReaderProps}
      className={`min-h-11 flex-row items-center gap-0.5 self-start rounded border-2 pl-3.5 ${onRemove ? 'pr-0.5' : 'pr-3.5'} ${
        error ? 'border-danger-dark bg-danger-soft' : 'border-brand bg-brand-soft-dark'
      }`}
    >
      <Text className="font-sans text-body text-white">{label}</Text>
      {onRemove ? (
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(onRemove, screenReaderPressAnnouncement)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={screenReaderLabel ?? `Remove ${label}`}
          accessibilityHint={screenReaderHint}
          className="h-10 w-10 items-center justify-center active:opacity-70"
        >
          <CloseSmallIcon width={20} height={20} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}
