import { AccessibilityInfo, ActivityIndicator, Platform, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NearbyTeamsGrid } from '@/components/teams/NearbyTeamsGrid';
import { getViewer, setTeamFollowed, type Viewer } from '@/services/followService';
import { getTeamsInRegion } from '@/services/teamService';

// See All – Teams Nearby (6600), opened as /teams-nearby.
export default function TeamsNearbyScreen() {
  const queryClient = useQueryClient();

  const viewerQuery = useQuery({ queryKey: ['viewer'], queryFn: getViewer });
  const viewer = viewerQuery.data;
  const regionId = viewer?.regionId ?? null;

  const teamsQuery = useQuery({
    queryKey: ['teams-in-region', regionId],
    queryFn: () => getTeamsInRegion(regionId!),
    enabled: regionId !== null,
  });

  const follow = useMutation({
    mutationFn: ({ teamId, followed }: { teamId: string; followed: boolean; teamName: string }) =>
      setTeamFollowed(viewer!.uid, teamId, followed),
    onSuccess: (_, { teamId, followed, teamName }) => {
      queryClient.setQueryData<Viewer | null>(['viewer'], (old) =>
        old && {
          ...old,
          followedTeamIds: followed
            ? [...old.followedTeamIds, teamId]
            : old.followedTeamIds.filter((id) => id !== teamId),
        },
      );
      // TalkBack announces the checked change itself; VoiceOver doesn't announce "selected" changing.
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(`${followed ? 'Following' : 'Not following'} ${teamName}`);
      }
    },
  });

  if (viewerQuery.isPending || (regionId !== null && teamsQuery.isPending)) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFD101" accessibilityLabel="Loading teams" />
      </View>
    );
  }

  if (viewerQuery.isError || teamsQuery.isError) return <Message alert text="Couldn't load teams. Try again later." />;
  if (!viewer) return <Message text="Sign in to see teams near you." />;
  if (!viewer.hasProfile) return <Message text="We couldn't find your profile. Finish creating your account first." />;
  if (regionId === null) return <Message text="Add your region to your profile to see teams near you." />;
  if (!teamsQuery.data?.length) return <Message text="No teams in your region yet." />;

  const teams = teamsQuery.data;
  return (
    <NearbyTeamsGrid
      teams={teams}
      followedTeamIds={viewer.followedTeamIds}
      pendingTeamId={follow.isPending ? follow.variables?.teamId : undefined}
      failedTeamId={follow.isError ? follow.variables?.teamId : undefined}
      onToggleFollow={(teamId, followed) =>
        follow.mutate({ teamId, followed, teamName: teams.find((team) => team.id === teamId)?.name ?? '' })
      }
    />
  );
}

function Message({ text, alert = false }: { text: string; alert?: boolean }) {
  return (
    <View className="flex-1 items-center justify-center bg-black px-4">
      <Text accessibilityRole={alert ? 'alert' : 'text'} className="text-center font-sans text-xl text-white">
        {text}
      </Text>
    </View>
  );
}
