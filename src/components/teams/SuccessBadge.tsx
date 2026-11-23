import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

// SVG props can't take Tailwind classes, so these mirror the brand and on-brand tokens.
const GOLD = '#FFD101';
const INK = '#010101';

// Decorative by default: the heading below already says what happened, so screen readers skip it.
// With hideFromScreenReader={false} it's an image named "Success".
export function SuccessBadge({
  screenReaderLabel,
  hideFromScreenReader = true,
  screenReaderOrder,
}: ScreenReaderStopProps = {}) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible={!hideFromScreenReader}
      accessibilityRole={hideFromScreenReader ? undefined : 'image'}
      accessibilityLabel={hideFromScreenReader ? undefined : screenReaderLabel ?? 'Success'}
    >
      <Svg width={142} height={142} viewBox="0 0 142 142">
        <Circle cx={71} cy={71} r={71} fill={GOLD} />
        <Path
          d="M50 72.5L63.5 86L92 57.5"
          stroke={INK}
          strokeWidth={7.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
