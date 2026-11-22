import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import EditScreenShell from '@/components/account/EditScreenShell';
import FormField from '@/components/account/FormField';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { focusOn } from '@/utils/accessibility';
import { digitsOnly } from '@/utils/profileFormat';

export default function EditHockeyScreen() {
  return <ProfileGate>{(profile) => <HockeyForm profile={profile} />}</ProfileGate>;
}

function HockeyForm({ profile }: { profile: Profile }) {
  const [number, setNumber] = useState(profile.usaHockeyNumber ?? '');
  const [error, setError] = useState<string>();
  const inputRef = useRef<TextInputInstance>(null);
  const { save, isSaving, saveError } = useSaveProfile('USA Hockey number saved');

  const onSave = () => {
    const trimmed = number.trim();
    if (trimmed && trimmed !== digitsOnly(trimmed)) {
      setError('Use numbers only');
      focusOn(inputRef);
      return;
    }
    save({ usaHockeyNumber: trimmed || null }); // optional: empty is stored as null, like signup
  };

  return (
    <EditScreenShell title="Change hockey #">
      <FormField
        ref={inputRef}
        label="USA hockey number (Optional)"
        accessibilityLabel="USA Hockey number, optional"
        accessibilityValue={number ? undefined : { text: 'empty' }}
        value={number}
        onChangeText={(text) => {
          setNumber(text);
          setError(undefined);
        }}
        error={error}
        placeholder="#########"
        keyboardType="number-pad"
      />
      <SaveButton onPress={onSave} saving={isSaving} error={saveError} />
    </EditScreenShell>
  );
}
