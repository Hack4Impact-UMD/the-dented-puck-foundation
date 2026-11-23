import { View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  /** 1-based. */
  current: number;
  total: number;
};

/** Segmented progress bar at the top of a multi-step form (Figma: "Your info", step 1 of 3). */
export function StepProgress({ current, total, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={screenReaderLabel ?? `Step ${current} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
      className="flex-row gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => (
        <View key={index} className={`h-1.5 flex-1 rounded-[3px] ${index < current ? 'bg-brand' : 'bg-line-track'}`} />
      ))}
    </View>
  );
}
