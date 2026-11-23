import { View } from 'react-native';
import CheckSmallIcon from '@/assets/icons/check-small.svg';
import { screenReaderHiddenProps } from '@/components/accessibility';
import { colors } from './tokens';

/**
 * 28 px circle: yellow with a check when selected, grey outline when not (Figma: New message
 * people list, channel notification options). Visual only; the row or card around it carries
 * the checked state for screen readers.
 */
export function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <View
      {...screenReaderHiddenProps(true)}
      className={`h-7 w-7 items-center justify-center rounded-full ${selected ? 'bg-brand' : 'border-2 border-line'}`}
    >
      {selected ? <CheckSmallIcon width={18} height={18} color={colors.black} /> : null}
    </View>
  );
}
