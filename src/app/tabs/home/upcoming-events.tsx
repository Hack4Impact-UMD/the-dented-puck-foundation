import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { UpcomingEventsList } from '@/components/events/UpcomingEventsList';
import { getUpcomingEvents } from '@/services/eventService';
import { getViewer } from '@/services/followService';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

// See All – Upcoming Events (6300), opened from Home's "See all upcoming events". The Home stack
// (tabs/home/_layout.tsx) supplies the header, back button and tab bar.
export default function UpcomingEventsScreen() {
  return (
    <>
      {/* Home's first screen has no title, so iOS would show and read "index" on the back button.
          Arrow only, labeled "Back" as in the annotation. */}
      <Stack.Screen options={{ title: 'Upcoming Events', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }} />
      <UpcomingEventsContent />
    </>
  );
}

function UpcomingEventsContent() {
  // Home's signed-in viewer, so cards can show "Joined" / "Followed" like on Home.
  const { state } = useHomeDashboard();
  const viewerQuery = useQuery({ queryKey: ['viewer'], queryFn: getViewer });
  const viewer = viewerQuery.data;

  // Events from every region; the user's region is only used for Sort > Nearest.
  const eventsQuery = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => getUpcomingEvents(),
    enabled: !!viewer,
  });

  if (viewerQuery.isPending || (!!viewer && eventsQuery.isPending)) {
    return <ScreenMessage loading label="Loading events" />;
  }
  if (viewerQuery.isError || eventsQuery.isError) return <ScreenMessage alert text="Couldn't load events. Try again later." />;
  if (!viewer) return <ScreenMessage text="Sign in to see upcoming events." />;
  if (!eventsQuery.data?.length) return <ScreenMessage text="No upcoming events yet." />;

  return <UpcomingEventsList events={eventsQuery.data} viewerRegionId={viewer.regionId} homeViewer={state.viewer} />;
}
