import { Text } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

interface TabBarLabelProps extends ScreenReaderStopProps {
  title: string;
  focused: boolean;
}

export function TabBarLabel({ title, focused, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: TabBarLabelProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Text
      {...screenReaderProps}
      accessibilityLabel={screenReaderLabel}
      className={`text-label text-white ${focused ? 'font-sans-bold' : 'font-sans'}`}
    >
      {title}
    </Text>
  );
}
