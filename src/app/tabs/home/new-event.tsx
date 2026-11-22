import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthButton } from "@/components/auth/AuthButton";
import { PickerRow } from "@/components/events/PickerRow";

export default function NewEventScreen() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
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
          label="Date"
          placeholder="Select date"
          hint="Opens the date picker"
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
