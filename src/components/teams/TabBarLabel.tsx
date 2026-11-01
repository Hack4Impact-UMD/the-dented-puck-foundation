import { Text } from 'react-native';

interface TabBarLabelProps {
  title: string;
  focused: boolean;
}

export function TabBarLabel({ title, focused }: TabBarLabelProps) {
  return (
    <Text className={`text-xs text-white ${focused ? 'font-sans-bold' : 'font-sans'}`}>{title}</Text>
  );
}
