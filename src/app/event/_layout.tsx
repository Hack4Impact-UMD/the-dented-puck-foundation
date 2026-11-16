import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Scoped to the event screens so the shared root layout stays untouched. If the app gets a
// global QueryClientProvider later, delete this provider and keep the Stack.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => console.error('Failed to load', query.queryKey, err),
  }),
});

export default function EventLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* web:max-w keeps the page phone-width in a desktop browser; it has no effect on iOS or Android. */}
      <View className="w-full flex-1 self-center web:max-w-[430px]">
        {/* The root layout hides headers; the event screens use the native one (back button + title). */}
        <Stack
          screenOptions={{
            headerShown: true,
            title: 'Event Details',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#010101' },
            headerTitleStyle: { fontFamily: 'AtkinsonHyperlegible_700Bold' },
          }}
        />
      </View>
    </QueryClientProvider>
  );
}
