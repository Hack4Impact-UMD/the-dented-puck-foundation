import type { RsvpResponse } from '../RsvpSection';

export const REPLY_ORDER: RsvpResponse[] = ['going', 'maybe', 'cant-go'];

// Group titles from the design: "8 going", "2 maybe", "1 can't go".
export function replyHeading(status: RsvpResponse, count: number) {
  return `${count} ${status === 'cant-go' ? "can't go" : status}`;
}
