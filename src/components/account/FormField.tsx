import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { AuthTextField } from '@/components/auth/AuthTextField';

type Props = ComponentProps<typeof AuthTextField>;

// Thin wrapper over the shared auth field. The Account annotations want the error
// read as part of the field's name ("First name, <error>"), so it goes in the label.
export default function FormField({ label, error, accessibilityLabel, ...props }: Props) {
  const name = accessibilityLabel ?? label;
  return (
    <View className="mb-4">
      <AuthTextField
        label={label}
        error={error}
        accessibilityLabel={error ? `${name}, ${error}` : name}
        accessibilityHint={undefined}
        {...props}
      />
    </View>
  );
}
