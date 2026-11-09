import { Text, View, useWindowDimensions } from 'react-native';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { HomeMessage } from '@/components/home/HomeMessage';
import { NearbyTeamCard } from '@/components/home/NearbyTeamCard';
import { HomeSeeAll } from '@/components/home/HomeSeeAll';
import { HomeTransition } from '@/components/home/HomeTransition';
import { NEARBY_PREVIEW_SIZE } from '@/types/home';

export function NearbyTeamsSection() {
  const { state, refresh, destinations } = useHomeDashboard();
  const { width, fontScale } = useWindowDimensions();
  const nearby = state.nearby;
  const singleColumn = width < 360 || fontScale > 1.3;
  const items = nearby?.items.slice(0, NEARBY_PREVIEW_SIZE);
  return <HomeTransition className="gap-6">
    <View className="flex-row flex-wrap items-center justify-between gap-3">
      <Text accessibilityRole="header" className="shrink font-sans-bold text-[26px] leading-[34px] text-white">Teams Nearby</Text>
      {(nearby?.items.length ?? 0) > NEARBY_PREVIEW_SIZE && <HomeSeeAll label="See all nearby teams" href={destinations.nearbyTeamList} />}
    </View>
    {nearby?.loading ? <HomeTransition key="loading" presence><HomeMessage loading title="Finding nearby teams" /></HomeTransition>
      : nearby?.error ? <HomeTransition key="error" presence><HomeMessage title="Unable to load nearby teams" message={nearby.error} action="Try again" onAction={refresh} /></HomeTransition>
      : !items?.length ? <HomeTransition key="empty" presence><HomeMessage
        title={state.viewer?.discoveryLocation ? 'No nearby teams to discover' : 'Choose a location for nearby teams'}
        message={state.viewer?.discoveryLocation ? 'Try another location. Teams you have joined are excluded.' : 'Use your device location or select a city above.'} /></HomeTransition>
      : <HomeTransition key="teams" className="flex-row flex-wrap gap-5">
        {items.map((team) => <HomeTransition key={team.id} presence style={{ width: singleColumn ? '100%' : '45%', flexGrow: 1 }}><NearbyTeamCard team={team} /></HomeTransition>)}
      </HomeTransition>}
  </HomeTransition>;
}
