import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { EventDetails } from '@/components/events/EventDetails';
import type { RsvpResponse } from '@/components/events/RsvpSection';
import { CoachEventDetails } from '@/components/events/coach/CoachEventDetails';
import { EditEventButton } from '@/components/events/coach/EditEventButton';
import { addEventToCalendar } from '@/services/calendarService';
import { getEvent, getTeamByTeamId } from '@/services/eventService';
import { getViewer, isStaff } from '@/services/followService';
import { getEventReplies, getMyRsvp, setMyRsvp } from '@/services/rsvpService';

// Event Details, opened from an event card on Home or See All. Players see 6400; coaches and
// team staff see 6450. The Home stack (tabs/home/_layout.tsx) supplies the header and tab bar.
export default function EventDetailsScreen() {
  return (
    <>
      {/* Home's first screen has no title, so iOS would show and read "index" on the back button.
          Arrow only, labeled "Back" as in the annotation. */}
      <Stack.Screen options={{ title: 'Event Details', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }} />
      <EventDetailsContent />
    </>
  );
}

function EventDetailsContent() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const viewerQuery = useQuery({ queryKey: ['viewer'], queryFn: getViewer });
  const staff = isStaff(viewerQuery.data);

  const eventQuery = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
  const event = eventQuery.data;

  // The design shows one team, so the event's first team is used.
  const teamId = event?.teamIds[0];
  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamByTeamId(teamId!),
    enabled: teamId !== undefined,
  });
  const team = teamQuery.data;

  // Coaches see everyone's replies; players see and change their own.
  const repliesQuery = useQuery({
    queryKey: ['replies', eventId],
    queryFn: () => getEventReplies(eventId),
    enabled: staff,
  });
  const myRsvpQuery = useQuery({
    queryKey: ['my-rsvp', eventId],
    queryFn: () => getMyRsvp(eventId),
    enabled: !!viewerQuery.data && !staff,
  });
  const saveRsvp = useMutation({
    mutationFn: (value: RsvpResponse) => setMyRsvp(eventId, value),
    onSuccess: (_, value) => {
      queryClient.setQueryData(['my-rsvp', eventId], value);
      queryClient.invalidateQueries({ queryKey: ['replies', eventId] });
    },
  });

  const add_to_calendar_button = () => {
    if (!event) return;
    addEventToCalendar(event).catch((err) => console.error('Failed to open calendar', eventId, err));
  };

  if (
    viewerQuery.isPending ||
    eventQuery.isPending ||
    (teamId !== undefined && teamQuery.isPending) ||
    repliesQuery.isLoading ||
    myRsvpQuery.isLoading
  ) {
    return <ScreenMessage loading label="Loading event" />;
  }

  if (!event || !team) return <ScreenMessage alert text="Couldn't load this event" />;

  if (staff) {
    return (
      <>
        <Stack.Screen options={{ headerRight: () => <EditEventButton /> }} />
        <CoachEventDetails
          event={event}
          teamName={team.name}
          replies={repliesQuery.data ?? null}
          onAddToCalendar={add_to_calendar_button}
          onSeeAllReplies={() => router.push({ pathname: '/tabs/home/event/[eventId]/replies', params: { eventId } })}
          onEditNote={() => router.push({ pathname: '/tabs/home/event/[eventId]/note', params: { eventId } })}
        />
      </>
    );
  }

  return (
    <EventDetails
      event={event}
      teamName={team.name}
      onAddToCalendar={add_to_calendar_button}
      initialRsvp={myRsvpQuery.data ?? null}
      onRsvpChange={(value) => saveRsvp.mutate(value)}
      rsvpSaveFailed={saveRsvp.isError}
    />
  );
}
