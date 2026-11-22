import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import EditScreenShell from '@/components/account/EditScreenShell';
import FormField from '@/components/account/FormField';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { focusOn } from '@/utils/accessibility';

export default function EditNameScreen() {
  return <ProfileGate>{(profile) => <NameForm profile={profile} />}</ProfileGate>;
}

function NameForm({ profile }: { profile: Profile }) {
  const [firstName, setFirstName] = useState(profile.firstName ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [errors, setErrors] = useState<{ first?: string; last?: string }>({});
  const firstRef = useRef<TextInputInstance>(null);
  const lastRef = useRef<TextInputInstance>(null);
  const { save, isSaving, saveError } = useSaveProfile('Name saved');

  const onSave = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      setErrors({
        first: first ? undefined : 'Enter your first name',
        last: last ? undefined : 'Enter your last name',
      });
      focusOn(first ? lastRef : firstRef); // move focus to the first problem
      return;
    }
    setErrors({});
    save({ firstName: first, lastName: last });
  };

  return (
    <EditScreenShell title="Change name">
      <FormField
        ref={firstRef}
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        error={errors.first}
        textContentType="givenName"
        autoComplete="name-given"
        returnKeyType="next"
        onSubmitEditing={() => lastRef.current?.focus()}
      />
      <FormField
        ref={lastRef}
        label="Last name"
        value={lastName}
        onChangeText={setLastName}
        error={errors.last}
        textContentType="familyName"
        autoComplete="name-family"
        returnKeyType="done"
        onSubmitEditing={onSave}
      />
      <SaveButton onPress={onSave} saving={isSaving} error={saveError} />
    </EditScreenShell>
  );
}