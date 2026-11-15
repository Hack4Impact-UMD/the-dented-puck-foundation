// Show the same invite screen when a team ID is in the URL.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase';
import AppButton from '@/components/team/AppButton';
import { acceptInvitation, getInvitation, savePendingInvite } from '@/services/inviteService';

// Invite page
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  // auth listener for sign-in changes
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // fetches the invitation and caches it
  const { data: invitation, isPending, isError, error, refetch } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getInvitation(token),
    enabled: !!token,
  });

  // join the team then add to UserToTeam and update invite
  // re-route to the team's page
  const join = useMutation({
    mutationFn: () => acceptInvitation(token),
    onSuccess: (teamId) => router.replace(`/tabs/teams/${teamId}`),
  });

  // save the invite then prompt the user to signup or login before completing the invitation
  async function goToAuth(path: '/auth/signup' | '/auth/login') {
    await savePendingInvite(token);
    router.push(path);
  }

  // PLACEHOLDER: loading screen while the invitation is being fetched
  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFD101" accessibilityLabel="Loading invite" />
      </SafeAreaView>
    );
  }

  // PLACEHOLDER: error screen due to fetching invitation error
  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-6 bg-black px-4">
        <Text accessibilityRole="alert" className="text-white text-xl text-center">
          Could not load this invite
        </Text>
        <Text className="text-white">{String(error)}</Text>
        <AppButton title="Try again" onPress={() => refetch()} variant="outline" />
      </SafeAreaView>
    );
  }

  // PLACEHOLDER: missing invitation screen
  if (!invitation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black px-4">
        <Text accessibilityRole="header" className="text-white text-xl text-center">
          This invite is invalid or has expired
        </Text>
      </SafeAreaView>
    );
  }

  // PLACEHOLDER: invitation screen
  return (
    <SafeAreaView className="flex-1 justify-center gap-6 bg-black px-4">
      <Text accessibilityRole="header" className="text-white text-2xl text-center">
        You have been invited to join {invitation.teamName}
      </Text>

      {join.isError ? (
        <Text accessibilityRole="alert" className="text-red-400 text-center">
          {join.error.message || 'Something went wrong. Please try again.'}
        </Text>
      ) : null}

      {user?.emailVerified ? (
        <AppButton
          title={join.isPending ? 'Joining…' : 'Join team'}
          onPress={() => { if (!join.isPending) join.mutate(); }}
          variant="secondary"
          accessibilityLabel={`Join ${invitation.teamName}`}
        />
      ) : (
        <View className="gap-4">
          <AppButton
            title="Sign up"
            onPress={() => goToAuth('/auth/signup')}
            variant="secondary"
            accessibilityHint={`Create an account to join ${invitation.teamName}`}
          />
          <AppButton
            title="Log in"
            onPress={() => goToAuth('/auth/login')}
            variant="outline"
            accessibilityHint={`Log in to join ${invitation.teamName}`}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
