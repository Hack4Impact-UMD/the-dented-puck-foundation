import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import EditScreenShell from '@/components/account/EditScreenShell';
import ProfileGate from '@/components/account/ProfileGate';
import SaveButton from '@/components/account/SaveButton';
import { useSaveProfile } from '@/hooks/useProfile';
import type { Profile } from '@/services/profileService';
import { focusOn } from '@/utils/accessibility';

// ASSUMPTION: replace with the exact list signup uses.
const OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function EditGenderScreen() {
  return <ProfileGate>{(profile) => <GenderForm profile={profile} />}</ProfileGate>;
}

function GenderForm({ profile }: { profile: Profile }) {
  const [gender, setGender] = useState(profile.gender ?? '');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const comboRef = useRef<ComponentRef<typeof Pressable>>(null);
  const { save, isSaving, saveError } = useSaveProfile('Gender saved');

  const onSave = () => {
    if (!gender) {
      setError('Choose a gender');
      focusOn(comboRef);
      return;
    }
    save({ gender });
  };

  return (
    <EditScreenShell title="Change gender">
      <Text accessibilityElementsHidden importantForAccessibility="no" className="mb-2 text-base font-sans-bold text-white">
        Gender
      </Text>
      <Pressable
        ref={comboRef}
        accessibilityRole="combobox"
        accessibilityLabel={error ? `Gender, ${error}` : 'Gender'}
        accessibilityValue={{ text: gender || 'none selected' }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        className="mb-4 min-h-12 flex-row items-center justify-between rounded-sm border border-neutral-500 bg-neutral-800 px-3"
      >
        <Text className="text-base font-sans text-white">{gender || 'Select'}</Text>
        <ChevronDown color="#FFFFFF" size={20} />
      </Pressable>
      {error ? (
        <Text accessibilityElementsHidden importantForAccessibility="no" className="-mt-2 mb-4 text-base font-sans text-red-400">
          {error}
        </Text>
      ) : null}

      <SaveButton onPress={onSave} saving={isSaving} error={saveError} />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={() => setOpen(false)}
          className="flex-1 bg-black/60"
        >
          {/* dimmed area above the sheet: tap to close; skipped by screen readers */}
          <Pressable accessible={false} onPress={() => setOpen(false)} className="flex-1" />

          <View className="rounded-t-2xl bg-neutral-900 pb-10 pt-2">
            {OPTIONS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ checked: option === gender }}
                onPress={() => {
                  setGender(option);
                  setError(undefined);
                  setOpen(false);
                }}
                className="min-h-14 justify-center px-6 active:opacity-60"
              >
                <Text className={`text-lg text-white ${option === gender ? 'font-sans-bold' : 'font-sans'}`}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </EditScreenShell>
  );
}
