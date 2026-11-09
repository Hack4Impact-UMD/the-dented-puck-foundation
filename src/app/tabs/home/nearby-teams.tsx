import { Redirect } from 'expo-router';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

// Compatibility for old links only; no team-directory implementation here.
export default function NearbyTeamsHandoff() {
  const { destinations } = useHomeDashboard();
  return <Redirect href={destinations.nearbyTeamList ?? { pathname: '/tabs/home', params: { view: 'discover' } }} />;
}
