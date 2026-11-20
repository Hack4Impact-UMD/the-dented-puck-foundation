import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import AppButton from '@/components/team/AppButton';

const LABEL = 'Note for players';
const MAX_LENGTH = 1000;

type Props = {
  initialNote: string;
  saving: boolean;
  saveFailed: boolean;
  onSave: (note: string) => void;
};

// 6451 – Edit Note. Reading order: the note field (labeled "Note for players"), then Save note.
// The visible label above the field is hidden from screen readers; the field carries the same label.
export function EditNoteForm({ initialNote, saving, saveFailed, onSave }: Props) {
  const [note, setNote] = useState(initialNote);

  return (
    <View className="flex-1 gap-4 bg-black p-4">
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="font-sans-bold text-base text-white"
      >
        {LABEL}
      </Text>
      <TextInput
        accessibilityLabel={LABEL}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
        className="min-h-40 rounded border border-line bg-surface-field p-3 font-sans text-base text-white"
      />
      <AppButton
        title={saving ? 'Saving…' : 'Save note'}
        accessibilityLabel="Save note"
        variant="secondary"
        onPress={() => !saving && onSave(note.trim())}
      />
      {saveFailed && (
        <Text accessibilityRole="alert" className="font-sans text-base text-danger-dark">
          {"Couldn't save the note. Try again."}
        </Text>
      )}
    </View>
  );
}
