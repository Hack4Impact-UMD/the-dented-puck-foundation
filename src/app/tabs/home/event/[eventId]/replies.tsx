import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenMessage } from '@/components/ScreenMessage';
import { ReplyList } from '@/components/events/coach/ReplyList';
import { getViewer, isStaff } from '@/services/followService';
import { getEventReplies } from '@/services/rsvpService';

// 6452 – Replies (coach and team staff), opened from See all replies on 6450.
export default function RepliesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Replies', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }} />
      <RepliesContent />
    </>
  );
}

function RepliesContent() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const viewerQuery = useQuery({ queryKey: ['viewer'], queryFn: getViewer });
  const staff = isStaff(viewerQuery.data);
  const repliesQuery = useQuery({
    queryKey: ['replies', eventId],
    queryFn: () => getEventReplies(eventId),
    enabled: staff,
  });

  if (viewerQuery.isPending || repliesQuery.isLoading) return <ScreenMessage loading label="Loading replies" />;
  if (!staff) return <ScreenMessage text="Only coaches and team staff can see replies." />;
  if (!repliesQuery.data) return <ScreenMessage alert text="Couldn't load replies. Try again later." />;

  return <ReplyList replies={repliesQuery.data} />;
}
