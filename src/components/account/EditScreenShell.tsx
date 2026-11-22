import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

type Props = {
  title: string;
  left?: 'cancel' | 'back';
  onLeft?: () => void;
  children: ReactNode;
};

export default function EditScreenShell({ title, left = 'cancel', onLeft, children }: Props) {
  const isCancel = left === 'cancel';
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCancel ? 'Cancel' : 'Back'}
          onPress={onLeft ?? (() => router.back())}
          className="h-12 w-20 justify-center"
          style={{ minHeight: 48 }}
        >
          {isCancel ? (
            <Text className="text-lg font-sans text-white">Cancel</Text>
          ) : (
            <ChevronLeft color="#FFFFFF" size={28} />
          )}
        </Pressable>
        <Text accessibilityRole="header" className="flex-1 text-center text-2xl font-sans-bold text-white">
          {title}
        </Text>
        {/* spacer keeps the title centered without absolute positioning */}
        <View className="w-20" />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-8 pt-6">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
