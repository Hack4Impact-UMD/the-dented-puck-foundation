import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import EditScreenShell from '@/components/account/EditScreenShell';
import FormField from '@/components/account/FormField';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { focusOn } from '@/utils/accessibility';
import { digitsOnly, formatPhone } from '@/utils/profileFormat';

export default function EditPhoneScreen() {
  return <ProfileGate>{(profile) => <PhoneForm profile={profile} />}</ProfileGate>;
}

function PhoneForm({ profile }: { profile: Profile }) {
  const [phone, setPhone] = useState(formatPhone(profile.phoneNumber ?? ''));
  const [error, setError] = useState<string>();
  const inputRef = useRef<TextInputInstance>(null);
  const { save, isSaving, saveError } = useSaveProfile('Phone number saved');

  const onSave = () => {
    const count = digitsOnly(phone).length;
    if (count !== 0 && count !== 10) {
      setError('Enter a 10-digit phone number');
      focusOn(inputRef);
      return;
    }
    save({ phoneNumber: digitsOnly(phone) }); // stored as digits only, like signup
  };

  return (
    <EditScreenShell title="Change phone #">
      <FormField
        ref={inputRef}
        label="Phone number"
        value={phone}
        onChangeText={(text) => {
          setPhone(formatPhone(text)); // formats as you type and accepts pasted numbers
          setError(undefined);
        }}
        error={error}
        placeholder="(123) 456-7890"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
      />
      <SaveButton onPress={onSave} saving={isSaving} error={saveError} />
    </EditScreenShell>
  );
}
