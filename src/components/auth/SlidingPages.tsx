import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

type SlidingPagesProps = {
  activeIndex: number;
  reduceMotion: boolean;
  children: ReactNode[];
};

export default function SlidingPages({ activeIndex, reduceMotion, children }: SlidingPagesProps) {
  const [width, setWidth] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [position] = useState(() => new Animated.Value(activeIndex));
  const previousIndex = useRef(activeIndex);

  useLayoutEffect(() => {
    if (!width || reduceMotion || previousIndex.current === activeIndex) {
      position.setValue(activeIndex);
      previousIndex.current = activeIndex;
      setTransitioning(false);
      return;
    }

    previousIndex.current = activeIndex;
    setTransitioning(true);
    const animation = Animated.timing(position, {
      toValue: activeIndex,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished) setTransitioning(false);
    });
    return () => animation.stop();
  }, [activeIndex, position, reduceMotion, width]);

  return (
    <View style={styles.viewport} onLayout={event => setWidth(event.nativeEvent.layout.width)} testID="account-pages">
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={[
            styles.page,
            { display: index === activeIndex || transitioning ? 'flex' : 'none' },
            { transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [index * width, (index - 1) * width] }) }] },
          ]}
          pointerEvents={index === activeIndex ? 'auto' : 'none'}
          aria-hidden={index !== activeIndex}
          accessibilityElementsHidden={index !== activeIndex}
          importantForAccessibility={index === activeIndex ? 'auto' : 'no-hide-descendants'}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  page: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
