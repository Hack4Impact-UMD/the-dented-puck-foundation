import { useQuery } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { UpcomingEventsList } from '@/components/events/UpcomingEventsList';
import { getUpcomingEvents } from '@/services/eventService';
import { getViewer } from '@/services/followService';

// See All – Upcoming Events (6300), opened as /upcoming-events.
export default function UpcomingEventsScreen() {
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

  return <UpcomingEventsList events={eventsQuery.data} viewerRegionId={viewer.regionId} />;
}
