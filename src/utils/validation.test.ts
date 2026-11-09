import { SAMPLE_ACCOUNT } from '@/components/auth/__fixtures__/sampleAccount';
import {
  birthdayToIso,
  formatBirthday,
  formatPhone,
  validateAccountStep,
  validateEmail,
  validateLoginFields,
  validatePassword,
} from './validation';

describe('auth form validation', () => {
  it('uses the Figma email messages and trims surrounding spaces', () => {
    expect(validateEmail('  ')).toBe('Enter your email.');
    expect(validateEmail('sam@gmail')).toBe('Enter an email like name@example.com.');
    expect(validateEmail('  sam@gmail.com ')).toBeNull();
  });

  it('names exactly which password rule is missing (Figma 5410)', () => {
    expect(validatePassword('')).toBe('Enter a password.');
    expect(validatePassword('abc')).toBe('Use at least 8 characters and add at least one number.');
    expect(validatePassword('abc1')).toBe('Use at least 8 characters.');
    expect(validatePassword('abcdefgh')).toBe('Add at least one number.');
    expect(validatePassword('hockey2026')).toBeNull();
  });

  it('only checks that login fields are filled in (Figma 5110)', () => {
    expect(validateLoginFields(' ', '')).toEqual({ email: 'Enter your email.', password: 'Enter your password.' });
    expect(validateLoginFields('not-an-email', 'short')).toEqual({ email: null, password: null });
  });
});

describe('account onboarding validation', () => {
  it('requires names and the second-step details but permits optional fields', () => {
    expect(validateAccountStep({ ...SAMPLE_ACCOUNT, firstName: ' ', lastName: '' }, 1)).toEqual({
      firstName: 'Enter your first name.',
      lastName: 'Enter your last name.',
    });
    expect(validateAccountStep({ ...SAMPLE_ACCOUNT, gender: '', birthday: '02/30/02' }, 2)).toEqual({
      gender: 'Select a gender.',
      birthday: 'Enter a valid birthday (MM/DD/YY).',
    });
    expect(validateAccountStep({ ...SAMPLE_ACCOUNT, usaHockeyNumber: '' }, 3)).toEqual({});
  });

  it('rejects invalid contact values and accepts a normal phone number', () => {
    expect(validateAccountStep({ ...SAMPLE_ACCOUNT, email: 'not-email', phoneNumber: '123' }, 3)).toEqual({
      email: 'Enter a valid email address.',
      phoneNumber: 'Enter a 10-digit phone number.',
    });
    expect(formatPhone('3015550142')).toBe('(301) 555-0142');
  });

  it('formats typed birthdays and rejects impossible or future dates', () => {
    expect(formatBirthday('061402')).toBe('06/14/02');
    expect(birthdayToIso('06/14/02')).toBe('2002-06-14');
    expect(birthdayToIso('02/29/23')).toBeNull();
    expect(birthdayToIso('12/31/2099')).toBeNull();
  });
});
