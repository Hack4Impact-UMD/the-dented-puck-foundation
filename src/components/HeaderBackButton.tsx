import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// Each of our screens has its own Stack, so the native header never sees the previous screen
// (it's in the parent stack, whose header is hidden) and draws no back arrow. This one uses the
// app-wide history instead. Labels follow the annotations: "Back" on iOS, "Navigate up" on Android.
export function HeaderBackButton() {
  if (!router.canGoBack()) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={Platform.OS === 'android' ? 'Navigate up' : 'Back'}
      hitSlop={8}
      className="min-h-11 min-w-11 justify-center active:opacity-70"
    >
      <Ionicons name="chevron-back" size={28} color="#FFFFFF" accessibilityElementsHidden importantForAccessibility="no" />
    </Pressable>
  );
}
