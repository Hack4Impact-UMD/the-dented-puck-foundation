import { View } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthErrorMessage } from '@/components/auth/AuthErrorMessage';

type Props = { onPress: () => void; saving: boolean; error?: string };

export default function SaveButton({ onPress, saving, error }: Props) {
  return (
    <>
      <View className="mt-2">
        <AuthButton label="Save" loadingLabel="Saving…" loading={saving} onPress={onPress} />
      </View>
      {error ? (
        <View className="mt-3">
          <AuthErrorMessage message={error} />
        </View>
      ) : null}
    </>
  );
}
