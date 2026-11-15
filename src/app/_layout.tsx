import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  useFonts,
} from "@expo-google-fonts/atkinson-hyperlegible";
import "../../global.css";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  // Fall back to the system font if loading fails
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
      </Stack>
    </QueryClientProvider>
  );
}
