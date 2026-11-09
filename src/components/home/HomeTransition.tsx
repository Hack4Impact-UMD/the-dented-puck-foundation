import type { ComponentPropsWithRef } from 'react';
import type { View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

// Reuse builders so an ordinary render does not restart a layout animation.
const layout = LinearTransition.duration(220).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);
const entering = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
const enteringFromBottom = FadeInDown.duration(220).reduceMotion(ReduceMotion.System);
const exiting = FadeOut.duration(100).reduceMotion(ReduceMotion.System);

/** Animate changed rows without replacing the surrounding screen or its controls. */
export function HomeTransition({ presence = false, fromBottom = false, ...props }: ComponentPropsWithRef<typeof View> & { presence?: boolean; fromBottom?: boolean }) {
  return <Animated.View {...props} layout={layout}
    entering={presence ? (fromBottom ? enteringFromBottom : entering) : undefined} exiting={presence ? exiting : undefined} />;
}
