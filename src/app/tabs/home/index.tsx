import { HomeDashboardScreen } from '@/components/home/HomeDashboardScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ForYouScreen() {
  const { view, search } = useLocalSearchParams<{ view?: string; search?: string }>();
  return <HomeDashboardScreen tab={view === 'discover' ? 'discover' : 'for-you'} initialSearch={search === '1'} />;
}
