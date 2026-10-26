import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import AppButton from '@/components/team/AppButton';
import TeamHeader from '@/components/team/TeamHeader';
import TeamInfoCard from '@/components/team/TeamInfoCard';
import { getTeam, getSeasonLabel } from '@/services/teamService';
import { TeamWithId } from '@/types';

// Team Info/Detail Page
export default function TeamInfo() {
  // get teamId from the current URL
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  // remember which teamId the result belongs to, so a new teamId shows loading again
  const [result, setResult] = useState<{ id: string; team: TeamWithId | null } | null>(null);
  const loading = result?.id !== teamId;
  const team = loading ? null : result.team;

  useEffect(() => {
    // ignore results from a previous teamId if the param changes mid-request
    let active = true;
    getTeam(teamId)
      .then((t) => { if (active) setResult({ id: teamId, team: t }); })
      .catch((err) => {
        console.error('Failed to load team', teamId, err);
        if (active) setResult({ id: teamId, team: null });
      });
    return () => { active = false; };
  }, [teamId]);

  // placeholder functions for now
  const back_button = () => router.back();
  const create_button = () => router.push('/tabs/teams/create');
  const view_roster_button = () => console.log('View roster pressed', teamId);
  const view_schedule_button = () => console.log('View schedule pressed', teamId);
  const chat_with_coach_button = () => console.log('Chat with coach pressed', teamId);
  const follow_button = () => console.log('Follow pressed', teamId);

  // join button waiting on join behavior
  const join_team_button = () => console.log('Join team pressed', teamId);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <TeamHeader onBack={back_button} onCreate={create_button} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFD101" accessibilityLabel="Loading team" />
        </View>
      ) : !team ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text accessibilityRole="header" className="text-white text-xl text-center">
            Team not found
          </Text>
        </View>
      ) : (
        <>
          <TeamInfoCard name={team.name} season={getSeasonLabel()}>
            <View className="flex-row gap-4 w-full mt-8">
              <AppButton 
                title="View roster" 
                onPress={view_roster_button} 
                variant="outline" 
                icon="list" 
                className="flex-1 px-2" 
                accessibilityLabel={`View ${team.name} roster`}
                accessibilityHint="Opens the team roster"
              />
              <AppButton 
                title="View schedule" 
                onPress={view_schedule_button} 
                variant="outline" 
                icon="calendar-outline" 
                className="flex-1 px-2" 
                accessibilityLabel={`View ${team.name} schedule`}
                accessibilityHint="Opens the team schedule"
              />
            </View>
            <AppButton 
              title="Chat with coach" 
              onPress={chat_with_coach_button} 
              variant="outline" icon="chatbox" 
              className="w-full mt-4" 
              accessibilityHint="Opens a chat with the team's coach"
            />
          </TeamInfoCard>

          <View className="mt-auto flex-row gap-4 px-4 pb-4">
            <AppButton 
                title="Follow" 
                onPress={follow_button} 
                variant="outline" 
                className="flex-1" 
                accessibilityLabel={`Follow ${team.name}`}
                accessibilityHint="Get updates from team"
            />
            <AppButton 
                title="Join team" 
                onPress={join_team_button} 
                variant="secondary" 
                className="flex-1" 
                accessibilityLabel={`Join ${team.name}`}
                accessibilityHint="Sends a request to join this team"
            />
          </View>
        </>
      )}

      {/* NAVBAR ? */}
    </SafeAreaView>
  );
}
