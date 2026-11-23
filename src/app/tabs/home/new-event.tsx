import { useCallback, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type PressableInstance,
  type TextInputInstance,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { PickerRow } from "@/components/events/PickerRow";
import {
  formatEventDate,
  fromDateParam,
  startOfToday,
} from "@/components/events/eventFormat";
import { createEvent } from "@/services/eventService";
import {
  SCREEN_READER_FOCUS_DELAY_MS,
  focusAccessibility,
  type FocusTarget,
} from "@/utils/accessibility";

const PLACEHOLDER_COLOR = "#BDBDBD";

// Moves screen reader focus after the Create press has settled
function focusLater(target: FocusTarget | null) {
  setTimeout(() => focusAccessibility(target), SCREEN_READER_FOCUS_DELAY_MS);
}

export default function NewEventScreen() {
  const { teamId, date } = useLocalSearchParams<{
    teamId: string;
    date?: string;
  }>();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const titleRef = useRef<TextInputInstance>(null);
  const dateRowRef = useRef<PressableInstance>(null);

  const titleError =
    submitted && !title.trim() ? "Enter an event name" : undefined;
  const isPastDate = !!date && fromDateParam(date) < startOfToday();
  const dateError = !submitted
    ? undefined
    : !date
      ? "Select a date"
      : isPastDate
        ? "Select a date that hasn't passed"
        : undefined;

  const create = useMutation({
    mutationFn: (eventDate: Date) =>
      createEvent({
        title: title.trim(),
        notes: notes.trim(),
        date: eventDate,
        teamId: Number(teamId),
      }),
    // Go to Home first so Back from the event page lands on Home, not this form
    onSuccess: (eventId) => {
      router.dismissTo("/tabs/home");
      router.push({ pathname: "/event/[eventId]", params: { eventId } });
    },
    onError: (err) => {
      console.error("Failed to create event", teamId, err);
      AccessibilityInfo.announceForAccessibility(
        "Couldn't create the event. Try again.",
      );
    },
  });

  function handleCreate() {
    setSubmitted(true);
    if (!title.trim()) return focusLater(titleRef.current);
    if (!date || isPastDate) return focusLater(dateRowRef.current);
    create.mutate(fromDateParam(date));
  }

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
          ref={titleRef}
          error={titleError}
          label="Event name"
          placeholder="Enter event name"
          placeholderTextColor={PLACEHOLDER_COLOR}
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
          error={dateError}
          onPress={() =>
            router.push({
              pathname: "/tabs/home/new-event-date",
              params: { teamId, date },
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
          placeholderTextColor={PLACEHOLDER_COLOR}
          multiline
          textAlignVertical="top"
          style={{ height: 140, paddingTop: 16 }}
          value={notes}
          onChangeText={setNotes}
        />
        {create.isError ? (
          <AuthErrorMessage message="Couldn't create the event. Try again." />
        ) : null}
        <AuthButton
          label="Create Event"
          accessibilityLabel="Create event"
          loading={create.isPending}
          loadingLabel="Creating…"
          onPress={handleCreate}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
