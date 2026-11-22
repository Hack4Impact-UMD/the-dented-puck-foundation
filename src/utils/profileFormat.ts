export function parseIsoDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d); // local date, avoids timezone shifts
}

export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function ageFromBirthday(iso?: string): string | undefined {
  const birth = parseIsoDate(iso);
  if (!birth) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return String(age);
}

export const formatShortDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

// spoken form for screen readers ("August 24, 2002")
export const formatLongDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const digitsOnly = (s: string) => s.replace(/\D/g, '');

export function formatPhone(input: string): string {
  let digits = digitsOnly(input);
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
