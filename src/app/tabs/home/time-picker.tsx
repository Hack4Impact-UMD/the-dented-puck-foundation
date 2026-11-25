import { useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Text, type TextInputInstance } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import AppButton from '@/components/team/AppButton';
import { Meridiem, TimeField } from '@/components/events/TimeField';

// ensures the user-entered time is valid
const isValidTime = (t: string) => {
  const matched = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!matched) return false;
  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  return hours >= 1 && hours <= 12 && minutes <= 59;
};

// splits a saved time like "hh:mm AM" into "hh:mm" and "AM" for pre-filling values when re-entering the Time Picker page
const splitTime = (t?: string): [string, Meridiem | undefined] => {
  const [time = '', m] = (t ?? '').split(' ');
  return [time, m === 'AM' || m === 'PM' ? m : undefined];
};

// converts "hh:mm" + AM/PM to minutes since midnight for validating that entered end time is after start time (e.g. "10:00" AM -> 600)
const toMinutes = (t: string, m: Meridiem) => {
  const [h, min] = t.split(':').map(Number);
  return ((h % 12) + (m === 'PM' ? 12 : 0)) * 60 + min;
};

export default function TimePickerScreen() {
  // passed in by the event creation page and sent back
  const { eventId, startTime, endTime } = useLocalSearchParams<{ eventId?: string; startTime?: string; endTime?: string }>();
  const [initStart, initStartM] = splitTime(startTime);
  const [initEnd, initEndM] = splitTime(endTime);
  const [start, setStart] = useState(initStart);
  const [startM, setStartM] = useState<Meridiem>(initStartM ?? 'AM');
  const [end, setEnd] = useState(initEnd);
  const [endM, setEndM] = useState<Meridiem>(initEndM ?? 'PM');
  const [error, setError] = useState<{ field: 'start' | 'end'; msg: string } | null>(null);
  const startRef = useRef<TextInputInstance>(null);
  const endRef = useRef<TextInputInstance>(null);

  // clears the time error whenever a field changes
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setError(null);
  };

  // Save Time button functionality
  const save = () => {
    // shows the error under the field and moves screen reader focus to that field
    const showError = (field: 'start' | 'end', msg: string) => {
      setError({ field, msg });
      const ref: RefObject<TextInputInstance | null> = field === 'start' ? startRef : endRef;
      // wait for the error to render for the screen reader to process the focus change
      setTimeout(() => {
        if (ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
      }, 300);
    };
    if (!isValidTime(start)) return showError('start', 'Enter a time in format hh:mm.');
    if (!isValidTime(end)) return showError('end', 'Enter a time in format hh:mm.');
    if (toMinutes(end, endM) <= toMinutes(start, startM)) return showError('end', 'End time must be after start time.');

    // dismissTo returns to the existing event creation screen instead of pushing a new copy
    router.dismissTo({
      // TODO: complete actual routing
      pathname: '/tabs/home/new-event', 
      params: { eventId, startTime: `${start} ${startM}`, endTime: `${end} ${endM}` },
    });
  };

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="gap-6 px-4 pt-6 pb-10">
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          // back button
          headerLeft: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/tabs/home'))}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={10}
              className="h-12 w-12 items-center justify-center active:opacity-70"
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF"/>
            </Pressable>
          )
        }}
      />
      <TimeField
        ref={startRef}
        label="Enter start time"
        accessibilityLabel="Start time"
        value={start}
        onChangeValue={edit(setStart)}
        meridiem={startM}
        onChangeMeridiem={edit(setStartM)}
        error={error?.field === 'start' ? error.msg : undefined}
      />
      <TimeField
        ref={endRef}
        label="Enter end time"
        accessibilityLabel="End time"
        value={end}
        onChangeValue={edit(setEnd)}
        meridiem={endM}
        onChangeMeridiem={edit(setEndM)}
        error={error?.field === 'end' ? error.msg : undefined}
      />
      {/* error shown above Save Time button */}
      {!!error && <Text aria-hidden className="font-sans text-lg text-danger-dark">{error.msg}</Text>}
      <AppButton
        title="Save Time"
        accessibilityLabel="Save time" 
        variant="secondary" onPress={save} 
        className="w-full px-4"
      />
    </ScrollView>
  );
}
