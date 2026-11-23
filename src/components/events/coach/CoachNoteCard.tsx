import { type ComponentRef, useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View } from 'react-native';

const TITLE = 'Note for players';
const EDIT = 'Edit note';
const EMPTY = 'No note yet.';

type Props = { notes?: string; onEdit: () => void };

// 6450, annotations 8 and 9. Reading order: "Note for players" (heading), Edit note, then the note.
// The button reads "Edit note" so it isn't confused with Edit event in the header.
export function CoachNoteCard({ notes, onEdit }: Props) {
  const noteRef = useRef<ComponentRef<typeof Text>>(null);
  const previous = useRef(notes);
  const text = notes?.trim() ? notes : EMPTY;

  // 6451: after Save note, focus moves to the updated note.
  useEffect(() => {
    if (previous.current === notes) return;
    previous.current = notes;
    if (Platform.OS !== 'web' && noteRef.current) AccessibilityInfo.sendAccessibilityEvent(noteRef.current, 'focus');
  }, [notes]);

  return (
    <View className="gap-3 rounded bg-surface-field p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" accessibilityLabel={TITLE} className="shrink font-sans-bold text-base text-ink-muted-dark">
          {TITLE}
        </Text>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={EDIT}
          hitSlop={8}
          className="min-h-12 min-w-12 items-end justify-center active:opacity-70"
        >
          <Text className="font-sans-bold text-base text-white underline">Edit</Text>
        </Pressable>
      </View>
      <Text ref={noteRef} accessibilityRole="text" accessibilityLabel={text} className="font-sans text-lg text-white">
        {text}
      </Text>
    </View>
  );
}
