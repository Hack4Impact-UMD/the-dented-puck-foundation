import { Stack } from 'expo-router';

export default function HomeLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: '#010101' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontFamily: 'AtkinsonHyperlegible_700Bold' }, contentStyle: { backgroundColor: '#010101' } }}>
    <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
    <Stack.Screen name="discover" options={{ headerShown: false, animation: 'none' }} />
    <Stack.Screen name="schedule" options={{ title: 'Schedule' }} />
    <Stack.Screen name="nearby-teams" options={{ title: 'Teams Nearby' }} />
    <Stack.Screen name="search" options={{ headerShown: false, animation: 'none' }} />
  </Stack>;
}
