import { EventWithId } from '@/types';

// Mock event for tests and local development. Nov 7, 2026 is a Saturday.
export const SAMPLE_EVENT: EventWithId = {
  id: 'event_sample',
  region: 'maryland',
  teamIds: ['team_sample'],
  title: 'Haunted Hat Trick',
  startTime: new Date(2026, 10, 7, 10, 0),
  endTime: new Date(2026, 10, 7, 12, 0),
  location: 'College Park Ice Arena, 8500 Paint Branch Dr, College Park, MD',
  notes: "Bring white and dark jerseys. We'll split into two groups.",
};

export const SAMPLE_TEAM_NAME = 'Baltimore Blades';
