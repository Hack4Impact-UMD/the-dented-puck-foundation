import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';
import { getInitials } from '@/components/events/eventFormat';

type Props = ScreenReaderStopProps & {
  /** Used for the initials, and for the spoken label when the avatar isn't decorative. */
  name: string;
  /** A photo. Without one, the initials are shown. */
  source?: ImageSourcePropType;
  /** Width and height in px. Figma uses 36, 40, 44, 52, 56 and 60. Default 44. */
  size?: number;
  /** `circle` for people and teams, `rounded` (8 px corners) for team tiles and channels. */
  shape?: 'circle' | 'rounded';
  /** Fill behind the initials: `brand` (yellow) for coaches, staff and teams, `light` (white) for players. */
  tone?: 'brand' | 'light';
  /** White 2 px ring around a photo (notification and account screens). */
  ring?: boolean;
  /** Overrides the initials (for example "T2" for "Team Name 2"). */
  initials?: string;
};

/**
 * A person or team picture: a photo, or initials on yellow or white. Decorative by default
 * because the name is almost always written next to it; pass `hideFromScreenReader={false}`
 * to make it a reading stop of its own.
 */
export function Avatar({
  name,
  source,
  size = 44,
  shape = 'circle',
  tone = 'brand',
  ring = false,
  initials,
  screenReaderLabel,
  hideFromScreenReader = true,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const radius = shape === 'circle' ? size / 2 : 8;
  // Figma sets initials in 18 px bold up to 60 px avatars, and scales them on bigger ones.
  const fontSize = size > 60 ? Math.round(size * 0.34) : 18;

  return (
    <View
      {...screenReaderProps}
      accessible={!hideFromScreenReader}
      accessibilityRole="image"
      accessibilityLabel={screenReaderLabel ?? name}
      style={{ width: size, height: size, borderRadius: radius }}
      className={`items-center justify-center overflow-hidden ${ring ? 'border-2 border-white' : ''} ${
        source ? 'bg-surface-well' : tone === 'brand' ? 'bg-brand' : 'bg-white'
      }`}
    >
      {source ? (
        <Image source={source} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontSize, lineHeight: fontSize > 18 ? Math.round(fontSize * 1.2) : 26 }} className="font-sans-bold text-on-brand">
          {initials ?? getInitials(name)}
        </Text>
      )}
    </View>
  );
}
