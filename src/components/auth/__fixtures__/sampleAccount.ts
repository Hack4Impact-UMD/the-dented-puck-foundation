import type { AccountForm } from '@/utils/validation';

// Test-only fixture: a complete, valid onboarding form.
export const SAMPLE_ACCOUNT: AccountForm = {
  firstName: 'Alex',
  lastName: 'Morgan',
  gender: 'Prefer not to say',
  birthday: '06/14/02',
  email: 'alex.morgan@example.com',
  phoneNumber: '(301) 555-0142',
  usaHockeyNumber: '123456789',
  allowLocation: false,
};
