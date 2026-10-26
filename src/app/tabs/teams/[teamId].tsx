import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
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

  // store the last fetched team and which teamId it belongs to
  const [result, setResult] = useState<{ id: string; team: TeamWithId | null } | null>(null);
  const loading = result?.id !== teamId;
  const team = loading ? null : result.team;

  // fetch team from Firestore whenever teamId changes then update results
  useEffect(() => {
    let active = true;
    getTeam(teamId)
      .then((t) => { if (active) setResult({ id: teamId, team: t }); })
      .catch((err) => {
        console.error('Failed to load team', teamId, err);
        if (active) setResult({ id: teamId, team: null });
      });
    return () => { active = false; };
  }, [teamId]);

  // stack buttons vertically when the system font size is large
  const { fontScale } = useWindowDimensions();
  const stack = fontScale > 1.3;
  const pairRow = stack ? 'flex-col' : 'flex-row';
  const pairItem = stack ? 'w-full' : 'flex-1';

  // placeholder functions before establishing functionality
  const back_button = () => router.back();
  const create_button = () => router.push('/tabs/teams/create');
  const view_roster_button = () => console.log('View roster pressed', teamId);
  const view_schedule_button = () => console.log('View schedule pressed', teamId);
  const chat_with_coach_button = () => console.log('Chat with coach pressed', teamId);
  const follow_button = () => console.log('Follow pressed', teamId);
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
            <View className={`${pairRow} gap-4 w-full mt-8`}>
              <AppButton
                title="View roster"
                onPress={view_roster_button}
                variant="outline"
                icon="list"
                className={`${pairItem} px-2`}
                accessibilityLabel="View roster"
                accessibilityHint={`Opens the ${team.name} roster`}
              />
              <AppButton
                title="View schedule"
                onPress={view_schedule_button}
                variant="outline"
                icon="calendar-outline"
                className={`${pairItem} px-2`}
                accessibilityLabel="View schedule"
                accessibilityHint={`Opens the ${team.name} schedule`}
              />
            </View>
            <AppButton
              title="Chat with coach"
              onPress={chat_with_coach_button}
              variant="outline"
              icon="chatbox"
              className="w-full mt-4"
              accessibilityLabel="Chat with coach"
              accessibilityHint="Opens a chat with the team's coach"
            />
          </TeamInfoCard>

          <View className={`mt-auto ${pairRow} gap-4 px-4 py-8`}>
            <AppButton
              title="Follow"
              onPress={follow_button}
              variant="outline"
              className={pairItem}
              accessibilityLabel="Follow team"
              accessibilityHint={`Get updates from ${team.name}`}
            />
            <AppButton
              title="Join team"
              onPress={join_team_button}
              variant="secondary"
              className={pairItem}
              accessibilityLabel="Join team"
              accessibilityHint={`Sends a request to the coach to join ${team.name}`}
            />
          </View>
        </>
      )}
      {/* NAVBAR */}
    </SafeAreaView>
  );
}
