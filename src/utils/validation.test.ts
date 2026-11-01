import { SAMPLE_ACCOUNT } from '@/components/auth/__fixtures__/sampleAccount';
import {
  birthdayToIso,
  formatBirthday,
  formatPhone,
  validateAccountStep,
} from './validation';

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
