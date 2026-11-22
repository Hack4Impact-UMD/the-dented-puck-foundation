import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import EditScreenShell from '@/components/account/EditScreenShell';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { announce, focusOn } from '@/utils/accessibility';
import { formatLongDate, formatShortDate, parseIsoDate, toIsoDate } from '@/utils/profileFormat';

export default function EditBirthdayScreen() {
  return <ProfileGate>{(profile) => <BirthdayForm profile={profile} />}</ProfileGate>;
}

function BirthdayForm({ profile }: { profile: Profile }) {
  const initial = parseIsoDate(profile.birthDate);
  const [date, setDate] = useState<Date>(initial ?? new Date(2000, 0, 1));
  const [picked, setPicked] = useState(!!initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const fieldRef = useRef<ComponentRef<typeof Pressable>>(null);
  const { save, isSaving, saveError } = useSaveProfile('Birthday saved');

  // VoiceOver doesn't move focus to a picker that just appeared
  useEffect(() => {
    if (open) {
      announce('Date picker open. Swipe right to reach it, then swipe up or down to change each value.');
    }
  }, [open]);

  const onValueChange = (_event: unknown, selected: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    setDate(selected);
    setPicked(true);
    setError(undefined);
  };

  const onSave = () => {
    if (!picked) {
      setError('Choose your birthday');
      focusOn(fieldRef);
      return;
    }
    save({ birthDate: toIsoDate(date) });
  };

  return (
    <EditScreenShell title="Change age">
      <Text accessibilityElementsHidden importantForAccessibility="no" className="mb-2 text-base font-sans-bold text-white">
        Birthday
      </Text>
      <Pressable
        ref={fieldRef}
        accessibilityRole="button"
        accessibilityLabel={error ? `Birthday, ${error}` : 'Birthday'}
        // spoken as a date ("August 24, 2002"), not "08/24/02"
        accessibilityValue={{ text: picked ? formatLongDate(date) : 'not set' }}
        onPress={() => setOpen((v) => !v)}
        className="mb-4 min-h-12 justify-center rounded-sm border border-neutral-500 bg-neutral-800 px-3"
      >
        <Text className="text-base font-sans text-white">{picked ? formatShortDate(date) : 'Select date'}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityElementsHidden importantForAccessibility="no" className="-mt-2 mb-4 text-base font-sans text-red-400">
          {error}
        </Text>
      ) : null}

      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          themeVariant="dark"
          onValueChange={onValueChange}
          onDismiss={() => setOpen(false)}
        />
      ) : null}

      <SaveButton onPress={onSave} saving={isSaving} error={saveError} />
    </EditScreenShell>
  );
}
