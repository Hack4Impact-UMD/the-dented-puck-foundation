export type AccountForm = {
  firstName: string;
  lastName: string;
  gender: string;
  birthday: string;
  email: string;
  phoneNumber: string;
  usaHockeyNumber: string;
  allowLocation: boolean;
};

export type AccountField = keyof AccountForm;
export type AccountErrors = Partial<Record<AccountField, string>>;

export function birthdayToIso(value: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value.trim());
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const shortYear = Number(match[3]);
  const currentYear = new Date().getFullYear();
  const year = match[3].length === 4
    ? shortYear
    : shortYear <= currentYear % 100 ? 2000 + shortYear : 1900 + shortYear;
  const date = new Date(year, month - 1, day);
  if (
    year < 1900 ||
    year > currentYear ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > new Date()
  ) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validateAccountStep(form: AccountForm, step: 1 | 2 | 3): AccountErrors {
  const errors: AccountErrors = {};
  if (step === 1) {
    if (!form.firstName.trim()) errors.firstName = 'Enter your first name.';
    if (!form.lastName.trim()) errors.lastName = 'Enter your last name.';
  }
  if (step === 2) {
    if (!form.gender) errors.gender = 'Select a gender.';
    if (!birthdayToIso(form.birthday)) errors.birthday = 'Enter a valid birthday (MM/DD/YY).';
  }
  if (step === 3) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (form.phoneNumber.replace(/\D/g, '').length !== 10) {
      errors.phoneNumber = 'Enter a 10-digit phone number.';
    }
  }
  return errors;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatBirthday(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
