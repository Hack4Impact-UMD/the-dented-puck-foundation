import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import TeamIcon from '@/components/team/TeamIcon';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import type { NearbyTeam } from '@/types/home';
import { HomeStatusText } from '@/components/home/HomeStatusText';
import { useHomeAnnouncement } from '@/hooks/useHomeAnnouncement';

export function NearbyTeamCard({ team }: { team: NearbyTeam }) {
  const { state, source, followTeam, destinations, isPreview } = useHomeDashboard();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  useHomeAnnouncement(feedback);
  const distance = team.distanceKm < 1 ? 'Less than 1 km away' : `${Math.round(team.distanceKm)} km away`;
  const joined = state.viewer?.teamIds.includes(team.id) ?? false;
  const followed = state.viewer?.followedTeamIds.includes(team.id) ?? false;
  // Demo teams have no document in the normal Team Info source. Never send a
  // fixture ID to that screen's live Firestore reader.
  const teamHref = !isPreview ? destinations.team?.(team.id) : undefined;

  async function follow() {
    if (pending) return;
    setPending(true);
    setError(null);
    setFeedback(null);
    try {
      await followTeam(team.id, !followed);
      setFeedback(followed ? `Unfollowed ${team.name}. Their events can appear in Discover.`
        : `Following ${team.name}. Their events appear in your schedule.`);
    }
    catch { setError(`Could not ${followed ? 'unfollow' : 'follow'} this team. Please try again.`); }
    finally { setPending(false); }
  }

  return <View className="flex-1 gap-[15px] rounded bg-surface-card p-[15px]">
    <Pressable accessible accessibilityRole="button"
      accessibilityLabel={`${team.name}, ${team.ageRange}, ${team.city}, ${distance}${joined ? ', Joined' : followed ? ', Followed' : ''}`}
      accessibilityState={{ disabled: pending || !teamHref, busy: pending }}
      accessibilityHint={teamHref ? 'Opens team details' : isPreview ? 'Team details are not available in this demo' : 'Team details are not available yet'}
      disabled={pending || !teamHref} onPress={teamHref && !pending ? () => router.push(teamHref) : undefined}
      className="items-center gap-2.5 active:opacity-70">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><TeamIcon name={team.name} size={60} /></View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="w-full">
        <Text className="text-center font-sans-bold text-[22px] leading-7 text-white">{team.name}</Text>
        <Text className="text-center font-sans text-lg leading-7 text-white">{team.ageRange}</Text>
        <Text className="text-center font-sans text-lg leading-6 text-ink-subtle">{team.city}</Text>
        <Text className="mt-1 text-center font-sans text-base leading-6 text-ink-subtle">{distance}</Text>
      </View>
    </Pressable>
    {joined ? <Text className="text-center font-sans-bold text-xl text-brand">Joined</Text> : <Pressable accessibilityRole="button" accessibilityLabel={`${followed ? 'Unfollow' : 'Follow'} ${team.name}`} accessibilityState={{ disabled: pending || !source?.setTeamFollowed, busy: pending }}
      disabled={pending || !source?.setTeamFollowed} onPress={follow} className="mt-auto min-h-14 items-center justify-center rounded bg-brand px-1.5 py-3 active:opacity-70">
      {pending ? <ActivityIndicator color="#010101" accessible={false} accessibilityElementsHidden importantForAccessibility="no" /> : <Text className="text-center font-sans-bold text-xl text-on-brand">{followed ? 'Unfollow' : 'Follow'}</Text>}
    </Pressable>}
    {error && <HomeStatusText className="font-sans text-base text-danger-dark">{error}</HomeStatusText>}
  </View>;
}
