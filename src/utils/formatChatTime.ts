const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// chat list timestamp: "9:41 PM" today, "Yesterday", weekday within a week, otherwise format as "11/1/26"
export function formatChatTime(timestamp: number, now: number = Date.now()) {
  const date = new Date(timestamp);
  const daysAgo = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS);

  if (daysAgo <= 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}
