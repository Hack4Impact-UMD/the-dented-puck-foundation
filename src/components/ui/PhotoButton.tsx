import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import PencilIcon from '@/assets/icons/pencil.svg';
import PersonIcon from '@/assets/icons/person.svg';
import PlusSmallIcon from '@/assets/icons/plus-small.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { colors } from './tokens';

type Props = ScreenReaderControlProps & {
  /** The current photo. Without one, a dashed circle with a person icon and a "+" badge. */
  source?: ImageSourcePropType;
  /** Opens the photo options, usually an `ActionSheet`. */
  onPress: () => void;
  /** Shown under the circle, for example "Add photo (optional)". */
  caption?: string;
};

/**
 * 88 px profile photo button (Figma 2200 "Add photo" and 8100 "Change photo"). Empty: dashed
 * circle and a yellow "+" badge. With a photo: white ring and a yellow pencil badge.
 */
export function PhotoButton({
  source,
  onPress,
  caption,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? (source ? 'Change photo' : (caption ?? 'Add photo'))}
      accessibilityHint={screenReaderHint}
      className="items-center gap-2.5 self-center active:opacity-80"
    >
      <View
        className={`h-[88px] w-[88px] items-center justify-center rounded-full ${
          source ? 'border-2 border-white' : 'border-2 border-dashed border-line-strong bg-surface-well'
        }`}
      >
        {source ? (
          <Image source={source} className="h-[84px] w-[84px] rounded-full" accessibilityIgnoresInvertColors />
        ) : (
          <PersonIcon width={40} height={40} color={colors.inkIcon} />
        )}
        <View className="absolute -bottom-1 -right-1.5 h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-brand">
          {source ? <PencilIcon width={16} height={16} color={colors.black} /> : <PlusSmallIcon width={18} height={18} color={colors.black} />}
        </View>
      </View>
      {caption ? <Text className="font-sans text-body text-ink-subtle">{caption}</Text> : null}
    </Pressable>
  );
}
