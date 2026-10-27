export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIREMENT = 'At least 8 characters, with one number';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an error message, or null if the email is valid.
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address, like name@example.com.';
  return null;
}

// Returns an error message, or null if the password meets the requirement.
export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';

  const missing: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) missing.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/\d/.test(password)) missing.push('one number');

  return missing.length ? `Password needs ${missing.join(' and ')}.` : null;
}
