import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// SVG props can't take Tailwind classes, so these mirror the brand and on-brand tokens.
const GOLD = '#FFD101';
const INK = '#010101';

// Decorative: the heading below already says what happened, so screen readers skip it.
export function SuccessBadge() {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
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
