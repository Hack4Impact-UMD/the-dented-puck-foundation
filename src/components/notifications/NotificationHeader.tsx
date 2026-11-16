import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Props = {
  title: string;
  onBack: () => void;
};

export function NotificationHeader({ title, onBack }: Props) {
  return (
    <View className="min-h-[60px] w-full flex-row items-center px-2">
      <Pressable
        onPress={onBack}
        className="h-12 w-12 items-center justify-center active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Back"
        accessibilityHint="Return to the previous screen"
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>
      <Text
        accessibilityRole="header"
        className="flex-1 text-center font-sans-bold text-[21px] leading-[30px] text-white"
      >
        {title}
      </Text>
      <View className="h-12 w-12" />
    </View>
  );
}
