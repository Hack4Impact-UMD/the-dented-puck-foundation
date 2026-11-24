import { Redirect, useLocalSearchParams } from 'expo-router';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

// Compatibility for old links only. See All screens belong to separate tasks.
export default function ScheduleHandoff() {
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();
  const { destinations } = useHomeDashboard();
  const href = section === 'schedule' || section === 'upcoming' ? destinations.eventList?.(section)
    : section === 'announcements' ? destinations.announcementList : undefined;
  return <Redirect href={href ?? { pathname: '/tabs/home', params: { view: section === 'upcoming' ? 'discover' : 'for-you' } }} />;
}
