import { memo } from 'react';
import { Image, View } from 'react-native';

const logo = require('@/assets/home/originals/foundation-logo.png');

// Figma 1488:25060: keep the uploaded 1200 × 480 bitmap and the exact
// image-to-pattern matrix from its SVG export, inside the 99 × 40 crop.
const crop = { width: 99, height: 40 };
const image = { width: 1200, height: 480 };
const transform = { scaleX: 0.00126147, scaleY: 0.003125, x: -0.0321101, y: -0.25 };

export const HomeWordmark = memo(function HomeWordmark() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="The Dented Puck Foundation"
      style={{ ...crop, overflow: 'hidden' }}
    >
      <Image
        accessible={false}
        importantForAccessibility="no"
        source={logo}
        fadeDuration={0}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: crop.width * image.width * transform.scaleX,
          height: crop.height * image.height * transform.scaleY,
          left: crop.width * transform.x,
          top: crop.height * transform.y,
        }}
      />
    </View>
  );
});
