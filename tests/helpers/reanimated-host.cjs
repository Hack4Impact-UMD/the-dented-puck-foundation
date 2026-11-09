// Exports check bundling; native animation appearance requires device review.
// Keep the real component tree and its accessibility props in host render tests.
exports.reanimatedHost = function reanimatedHost(host) {
  const builder = () => ({
    duration() { return this; }, easing() { return this; }, reduceMotion() { return this; },
  });
  return {
    __esModule: true,
    default: { View: host('Reanimated.View') },
    LayoutAnimationConfig: host('LayoutAnimationConfig'),
    LinearTransition: builder(), FadeIn: builder(), FadeInDown: builder(), FadeOut: builder(),
    Easing: { out: (curve) => curve, cubic: (value) => value ** 3 },
    ReduceMotion: { System: 'system' },
  };
};
