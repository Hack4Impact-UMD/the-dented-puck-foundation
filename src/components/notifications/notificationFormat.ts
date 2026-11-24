const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// List-row date: "10/28" in the current year, "10/28/25" otherwise.
export function formatNotificationListDate(date: Date, now = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (date.getFullYear() === now.getFullYear()) {
    return `${month}/${day}`;
  }
  return `${month}/${day}/${String(date.getFullYear()).slice(-2)}`;
}

// Detail timestamp: "Oct 28 at 4:12 pm"
export function formatNotificationDetailDate(date: Date) {
  const month = MONTHS_SHORT[date.getMonth()];
  const day = date.getDate();
  const hour = date.getHours() % 12 || 12;
  const minutes = date.getMinutes();
  const suffix = date.getHours() < 12 ? 'am' : 'pm';
  const time =
    minutes === 0
      ? `${hour} ${suffix}`
      : `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
  return `${month} ${day} at ${time}`;
}
