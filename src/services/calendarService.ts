import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import { EventWithId } from '@/types';

// Opens the system add-event sheet pre-filled with this event, so the user picks the calendar and saves.
// Imported from expo-calendar/legacy because the main entry's version of this method throws in SDK 58.
export function addEventToCalendar(event: EventWithId) {
  return createEventInCalendarAsync({
    title: event.title,
    startDate: event.startTime,
    endDate: event.endTime,
    location: event.location,
    notes: event.notes,
  });
}
