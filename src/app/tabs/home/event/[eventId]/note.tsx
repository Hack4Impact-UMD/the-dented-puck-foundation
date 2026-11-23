import { AccessibilityInfo } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { EditNoteForm } from '@/components/events/coach/EditNoteForm';
import { getEvent, updateEventNote } from '@/services/eventService';
import { getViewer, isStaff } from '@/services/followService';
import { EventWithId } from '@/types';

// 6451 – Edit Note (coach and team staff), opened from Edit note on 6450.
export default function EditNoteScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Edit Note', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }} />
      <EditNoteContent />
    </>
  );
}

function EditNoteContent() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const viewerQuery = useQuery({ queryKey: ['viewer'], queryFn: getViewer });
  const eventQuery = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });

  // Annotation 2: Save note returns to the event page, which moves focus to the note,
  // and announces "Note saved".
  const save = useMutation({
    mutationFn: (note: string) => updateEventNote(eventId, note),
    onSuccess: (_, note) => {
      queryClient.setQueryData<EventWithId | null>(['event', eventId], (old) => old && { ...old, notes: note });
      AccessibilityInfo.announceForAccessibility('Note saved');
      router.back();
    },
  });

  if (viewerQuery.isPending || eventQuery.isPending) return <ScreenMessage loading label="Loading note" />;
  if (!isStaff(viewerQuery.data)) return <ScreenMessage text="Only coaches and team staff can edit the note." />;
  if (!eventQuery.data) return <ScreenMessage alert text="Couldn't load this event" />;

  return (
    <EditNoteForm
      initialNote={eventQuery.data.notes ?? ''}
      saving={save.isPending}
      saveFailed={save.isError}
      onSave={(note) => save.mutate(note)}
    />
  );
}
