import { AccessibilityInfo, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { NearbyTeamsGrid } from '@/components/teams/NearbyTeamsGrid';
import { getViewer, setTeamFollowed, type Viewer } from '@/services/followService';
import { getTeamsInRegion } from '@/services/teamService';

// See All – Teams Nearby (6600), opened from Home's "See all nearby teams". The Home stack
// (tabs/home/_layout.tsx) supplies the "Teams Nearby" header, back button and tab bar.
export default function TeamsNearbyScreen() {
  return (
    <>
      {/* Home's first screen has no title, so iOS would show and read "index" on the back button.
          Arrow only, labeled "Back" as in the annotation. */}
      <Stack.Screen options={{ headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }} />
      <TeamsNearbyContent />
    </>
  );
}

function TeamsNearbyContent() {
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
    return <ScreenMessage loading label="Loading teams" />;
  }

  if (viewerQuery.isError || teamsQuery.isError) return <ScreenMessage alert text="Couldn't load teams. Try again later." />;
  if (!viewer) return <ScreenMessage text="Sign in to see teams near you." />;
  if (!viewer.hasProfile) return <ScreenMessage text="We couldn't find your profile. Finish creating your account first." />;
  if (regionId === null) return <ScreenMessage text="Add your region to your profile to see teams near you." />;
  if (!teamsQuery.data?.length) return <ScreenMessage text="No teams in your region yet." />;

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
