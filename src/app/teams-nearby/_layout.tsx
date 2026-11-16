import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function TeamsNearbyLayout() {
  return (
    // web:max-w keeps the page phone-width in a desktop browser; it has no effect on iOS or Android.
    <View className="w-full flex-1 self-center web:max-w-[430px]">
      {/* The root layout hides headers; this screen uses the native one (back button + title). */}
      <Stack
        screenOptions={{
          headerShown: true,
          title: 'Teams Nearby',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: '#FFFFFF',
          headerStyle: { backgroundColor: '#010101' },
          headerTitleStyle: { fontFamily: 'AtkinsonHyperlegible_700Bold' },
        }}
      />
    </View>
  );
}
