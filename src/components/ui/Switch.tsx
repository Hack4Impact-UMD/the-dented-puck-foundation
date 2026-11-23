import { View } from 'react-native';
import { screenReaderHiddenProps } from '@/components/accessibility';

type Props = {
  value: boolean;
};

/**
 * The on/off track from the Figma "Toggle" (51 × 31; yellow when on, light grey when off,
 * black knob). Visual only: put it inside a control that has the switch role, such as
 * `ToggleCard`, so the label and the switch are one reading stop.
 */
export function Switch({ value }: Props) {
  return (
    <View
      {...screenReaderHiddenProps(true)}
      className={`h-[31px] w-[51px] justify-center rounded-full px-0.5 ${value ? 'items-end bg-brand' : 'items-start bg-line-switch-off'}`}
    >
      <View className="h-[27px] w-[27px] rounded-full bg-black" />
    </View>
  );
}
