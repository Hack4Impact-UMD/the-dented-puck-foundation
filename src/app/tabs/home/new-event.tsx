import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type PressableInstance,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthButton } from "@/components/auth/AuthButton";
import { PickerRow } from "@/components/events/PickerRow";
import {
  formatEventDate,
  fromDateParam,
} from "@/components/events/eventFormat";
import {
  SCREEN_READER_FOCUS_DELAY_MS,
  focusAccessibility,
} from "@/utils/accessibility";

export default function NewEventScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const dateRowRef = useRef<PressableInstance>(null);

  // Put screen reader focus on the Date row so the new value is read when coming back from Date Picker
  useFocusEffect(
    useCallback(() => {
      if (!date) return;
      const timer = setTimeout(
        () => focusAccessibility(dateRowRef.current),
        SCREEN_READER_FOCUS_DELAY_MS,
      );
      return () => clearTimeout(timer);
    }, [date]),
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-10 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        <AuthTextField
          label="Event name"
          placeholder="Enter event name"
          returnKeyType="next"
          value={title}
          onChangeText={setTitle}
        />
        <PickerRow
          ref={dateRowRef}
          label="Date"
          placeholder="Select date"
          value={date ? formatEventDate(fromDateParam(date)) : undefined}
          hint="Opens the date picker"
          onPress={() =>
            router.push({
              pathname: "/tabs/home/new-event-date",
              params: { date },
            })
          }
        />
        {/* Time and location are placeholders for now */}
        <PickerRow
          label="Time"
          placeholder="Select start and end time"
          hint="Opens the time picker"
          disabled
        />
        <PickerRow
          label="Location"
          placeholder="Select location"
          hint="Opens location search"
          disabled
        />
        <AuthTextField
          label="Note for players (optional)"
          accessibilityLabel="Note for players, optional"
          placeholder="What should players know?"
          multiline
          textAlignVertical="top"
          style={{ height: 140, paddingTop: 16 }}
          value={notes}
          onChangeText={setNotes}
        />
        <AuthButton label="Create Event" accessibilityLabel="Create event" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
