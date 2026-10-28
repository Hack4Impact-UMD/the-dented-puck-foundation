import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { 
  ActivityIndicator, 
  ScrollView,
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InviteActions from '@/components/invite/InviteActions';
import InviteMessage from '@/components/invite/InviteMessage';
import TeamBadge from '@/components/invite/TeamBadge';

// Placeholder until the invites collection and invitation flow are available.
const PLACEHOLDER_TEAM_NAME = 'Baltimore Blades';

export default function InviteScreen() {
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegibleRegular: require('../../components/invite/fonts/AtkinsonHyperlegible-Regular.ttf'),
    AtkinsonHyperlegibleBold: require('../../components/invite/fonts/AtkinsonHyperlegible-Bold.ttf'),
  });
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const teamId = (Array.isArray(token) ? token[0] : token)?.trim() ?? '';
  const params = teamId ? { teamId } : {};

  if (fontError) throw fontError;

  if (!fontsLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <StatusBar style="light" />
        <ActivityIndicator accessibilityLabel="Loading invitation" color="#FFD101" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView className="flex-1" contentContainerClassName="grow items-center px-4 pb-12 pt-16">
        <View className="w-full max-w-md items-center">
          <TeamBadge teamName={PLACEHOLDER_TEAM_NAME} />
          <InviteMessage teamName={PLACEHOLDER_TEAM_NAME} />
          <InviteActions
            onCreateAccount={() => router.push({ pathname: '/auth/signup', params })}
            onLogIn={() => router.push({ pathname: '/auth/login', params })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
