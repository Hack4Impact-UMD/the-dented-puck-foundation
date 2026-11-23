import { Pressable, Text, View } from 'react-native';
import ChevronForwardIcon from '@/assets/icons/chevron-forward.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';

type Props = ScreenReaderControlProps & {
  label: string;
  /** Opens the picker screen (date, time, location). */
  onPress: () => void;
  value?: string;
  /** Second line under the value, for example the street address under a rink name. */
  detail?: string;
  /** Shown in grey until there's a value, for example "Select date". */
  placeholder?: string;
};

/**
 * Labeled field that opens another screen to pick a value (Figma 6500 New Event: Date, Time,
 * Location). Looks like a text field with a chevron. With a `detail`, the value is bold and the
 * detail sits under it (6501: rink name over address).
 */
export function PickerField({
  label,
  onPress,
  value,
  detail,
  placeholder = 'Select',
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  // An empty string counts as no value. The detail is only shown under a value.
  const shown = value || placeholder;
  const shownDetail = value ? detail : undefined;

  return (
    <View {...screenReaderProps} className="gap-2">
      <Text aria-hidden className="font-sans-bold text-body text-white">
        {label}
      </Text>
      <Pressable
        {...skipFocusProps(hideFromScreenReader)}
        onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
        accessibilityRole="button"
        accessibilityLabel={screenReaderLabel ?? [label, shown, shownDetail].filter(Boolean).join(', ')}
        accessibilityHint={screenReaderHint}
        className="min-h-14 flex-row items-center gap-3 rounded border-2 border-white bg-surface-field p-4 active:opacity-80"
      >
        <View className="flex-1 gap-1">
          <Text className={`text-[18px] ${value ? `text-white ${detail ? 'font-sans-bold leading-[26px]' : 'font-sans'}` : 'font-sans text-ink-subtle'}`}>
            {shown}
          </Text>
          {shownDetail ? <Text className="font-sans text-body-lg text-ink-quiet">{shownDetail}</Text> : null}
        </View>
        <ChevronForwardIcon width={24} height={24} />
      </Pressable>
    </View>
  );
}
