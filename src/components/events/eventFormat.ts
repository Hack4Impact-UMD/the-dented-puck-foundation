const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "10 am", "5:30 pm". Built by hand so the text doesn't depend on the device's Intl support.
function clock(date: Date) {
  const hour = date.getHours() % 12 || 12;
  const minutes = date.getMinutes();
  const suffix = date.getHours() < 12 ? 'am' : 'pm';
  return `${hour}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} ${suffix}`;
}

// The visible text and the screen reader label come from the same call, so they can't drift apart.
export function getEventWhen(start: Date, end: Date) {
  const weekday = WEEKDAYS[start.getDay()];
  const month = MONTHS[start.getMonth()];
  const day = start.getDate();
  const timeRange = `${clock(start)} to ${clock(end)}`;
  return {
    weekday,
    monthShort: month.slice(0, 3),
    day: String(day),
    timeRange,
    spoken: `${weekday}, ${month} ${day}, ${timeRange.replace(/am|pm/g, (s) => s.toUpperCase())}`,
  };
}

// "Saturday, November 21": the New Event Date row and each day button in the picker.
export function formatEventDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// "November 2026": the picker's month heading.
export function formatMonth(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Route params are strings. Uses the local date, because toISOString() is UTC and can shift the day.
export function toDateParam(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-11-21" -> local midnight on that day.
export function fromDateParam(param: string) {
  const [year, month, day] = param.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Screen readers say "Dr" and "MD" letter by letter, so the spoken label spells them out (per the Location annotation).
const STREET_WORDS: Record<string, string> = {
  Dr: 'Drive', St: 'Street', Ave: 'Avenue', Rd: 'Road', Blvd: 'Boulevard', Ln: 'Lane', Ct: 'Court', Pkwy: 'Parkway',
};
const STATES: Record<string, string> = {
  MD: 'Maryland', VA: 'Virginia', PA: 'Pennsylvania', DE: 'Delaware', WV: 'West Virginia', NJ: 'New Jersey', NY: 'New York',
};
// Only at the end of a part, so a venue like "St. Mary's Rink" keeps its "St."
const STREET_WORD_AT_END = new RegExp(`\\b(${Object.keys(STREET_WORDS).join('|')})\\.?$`);

function spellOut(parts: string[]) {
  return parts
    .map((part, index) =>
      index === parts.length - 1 && STATES[part]
        ? STATES[part]
        : part.replace(STREET_WORD_AT_END, (_, word: string) => STREET_WORDS[word]),
    )
    .join(', ');
}

// Events store one location string, e.g. "Venue, 123 Main St, City, ST".
// First part is the venue, the last two are city and state, anything between is the street.
export function splitLocation(location: string) {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  const lines =
    parts.length >= 3
      ? [
          parts[0],
          ...(parts.length > 3 ? [parts.slice(1, -2).join(', ')] : []),
          parts.slice(-2).join(', '),
        ]
      : parts;
  return { name: lines[0] ?? '', details: lines.slice(1), spoken: spellOut(parts) };
}

// "Baltimore Blades" -> "BB"
export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
