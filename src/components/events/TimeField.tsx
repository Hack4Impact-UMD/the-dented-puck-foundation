import type { Ref } from 'react';
import { Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';

export type Meridiem = 'AM' | 'PM';

type TimeFieldProps = {
  label: string;              // visible text on button
  accessibilityLabel: string; // text read by screen readers
  value: string;
  onChangeValue: (v: string) => void;
  meridiem: Meridiem;
  onChangeMeridiem: (m: Meridiem) => void;
  error?: string;
  ref?: Ref<TextInputInstance>;
};

// turn raw digits typed by the user into "hh:mm" format as they type (e.g. "1000" -> "10:00")
const formatTime = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, -2)}:${digits.slice(-2)}`;
};

export function TimeField({ label, accessibilityLabel, value, onChangeValue, meridiem, onChangeMeridiem, error, ref }: TimeFieldProps) {
  return (
    <View className="w-full gap-2">
      {/* "Enter start/end time" label */}
      <Text aria-hidden className="font-sans-bold text-lg leading-[26px] text-white">{label}</Text>

      <View className="flex-row items-start gap-3">
        {/* digits entered by the user */}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChangeValue(formatTime(t))}
          keyboardType="number-pad"
          maxLength={5}
          placeholder="00:00"
          placeholderTextColor="#BDBDBD"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error ? `Error: ${error}` : 'Hours and minutes'} // error read by screen reader
          className={`min-h-14 min-w-0 flex-1 rounded-[4px] border-2 bg-surface-field px-4 font-sans text-[18px] text-white ${error ? 'border-danger-dark' : 'border-white'}`}
        />

        {/* buttons to change between AM and PM meridiems */}
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={`${accessibilityLabel}, AM or PM`}
          className="shrink-0 flex-row rounded-lg bg-surface-field p-1"
        >
          {(['AM', 'PM'] as const).map((m) => {
            const selected = meridiem === m;
            return (
              <Pressable
                key={m}
                onPress={() => onChangeMeridiem(m)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={m}
                className={`h-12 w-[72px] items-center justify-center rounded-[4px] ${selected ? 'bg-brand' : ''}`}
              >
                <Text className={`font-sans-bold text-xl ${selected ? 'text-on-brand' : 'text-brand'}`}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
