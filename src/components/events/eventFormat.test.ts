import { SAMPLE_EVENT } from './__fixtures__/sampleEvent';
import { getEventWhen, getInitials, splitLocation } from './eventFormat';

describe('getEventWhen', () => {
  it('builds the visible text and the spoken label from the same times', () => {
    const when = getEventWhen(SAMPLE_EVENT.startTime, SAMPLE_EVENT.endTime);
    expect(when).toMatchObject({ weekday: 'Saturday', monthShort: 'Nov', day: '7', timeRange: '10 am to 12 pm' });
    expect(when.spoken).toBe('Saturday, November 7, 10 AM to 12 PM');
  });

  it('keeps minutes when they are not zero', () => {
    const when = getEventWhen(new Date(2026, 9, 15, 17, 30), new Date(2026, 9, 15, 19, 0));
    expect(when.timeRange).toBe('5:30 pm to 7 pm');
  });
});

describe('splitLocation', () => {
  it('splits venue, street and city/state', () => {
    expect(splitLocation(SAMPLE_EVENT.location)).toEqual({
      name: 'College Park Ice Arena',
      details: ['8500 Paint Branch Dr', 'College Park, MD'],
      spoken: 'College Park Ice Arena, 8500 Paint Branch Drive, College Park, Maryland',
    });
  });

  it('leaves "St." alone at the start of a venue name', () => {
    expect(splitLocation("St. Mary's Rink, 1 Main St, Annapolis, MD").spoken).toBe(
      "St. Mary's Rink, 1 Main Street, Annapolis, Maryland",
    );
  });

  it('handles a location without a street', () => {
    expect(splitLocation('Truxtun Park, Annapolis, MD')).toMatchObject({
      name: 'Truxtun Park',
      details: ['Annapolis, MD'],
    });
  });

  it('handles a bare venue name', () => {
    expect(splitLocation('Main Rink')).toMatchObject({ name: 'Main Rink', details: [] });
  });
});

describe('getInitials', () => {
  it('uses the first letter of the first two words', () => {
    expect(getInitials('Baltimore Blades')).toBe('BB');
    expect(getInitials('harbor hawks juniors')).toBe('HH');
    expect(getInitials('Comets')).toBe('C');
  });
});
