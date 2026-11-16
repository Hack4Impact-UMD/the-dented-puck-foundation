import { AccessibilityInfo, Platform } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { UpcomingEvent } from '@/services/eventService';
import { UpcomingEventsList } from './UpcomingEventsList';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/firebase', () => ({ auth: {}, db: {} }));
jest.mock('@react-native-vector-icons/ionicons', () => ({ Ionicons: () => null }));

const HAWKS = { id: 'team_201', name: 'Harbor Hawks', acronym: 'HH' };
const COMETS = { id: 'team_202', name: 'Chesapeake Comets', acronym: 'CC' };

const EVENTS: UpcomingEvent[] = [
  {
    id: 'event_301',
    title: 'Haunted Hat Trick',
    startTime: new Date(2026, 9, 31, 20),
    endTime: new Date(2026, 10, 1, 0),
    location: 'Quiet Waters Park, Field 2, Annapolis, MD',
    regionId: 1,
    teams: [HAWKS],
  },
  {
    id: 'event_302',
    title: 'Cranberry Cup',
    startTime: new Date(2026, 10, 26, 17),
    endTime: new Date(2026, 10, 26, 20),
    location: 'Truxtun Park, Annapolis, MD',
    regionId: 1,
    teams: [COMETS],
  },
];

const HAT_TRICK = 'Haunted Hat Trick, Saturday, October 31, 8 PM to 12 AM, Quiet Waters Park, Annapolis, Harbor Hawks';
const CRANBERRY = 'Cranberry Cup, Thursday, November 26, 5 PM to 8 PM, Truxtun Park, Annapolis, Chesapeake Comets';

describe('UpcomingEventsList', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads Filter, Sort, then each event card, soonest first', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    const stops = screen.getAllByRole('button').map((element) => element.props.accessibilityLabel);
    expect(stops).toEqual(['Filter', 'Sort', HAT_TRICK, CRANBERRY]);
  });

  it('gives Filter and Sort their current values', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    expect(screen.getByRole('button', { name: 'Filter' }).props.accessibilityValue).toMatchObject({ text: 'None' });
    expect(screen.getByRole('button', { name: 'Sort' }).props.accessibilityValue).toMatchObject({ text: 'By date' });
  });

  it('shows each team acronym on its card', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    expect(within(screen.getByRole('button', { name: HAT_TRICK })).getByText('HH')).toBeTruthy();
    expect(within(screen.getByRole('button', { name: CRANBERRY })).getByText('CC')).toBeTruthy();
  });

  it('opens Event Details for the tapped event', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: CRANBERRY }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/event/[eventId]', params: { eventId: 'event_302' } });
  });

  it('filters by team and updates the Filter value', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Chesapeake Comets' }));
    expect(screen.getByRole('button', { name: 'Chesapeake Comets', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByRole('button', { name: 'Filter' }).props.accessibilityValue).toMatchObject({ text: '1 applied' });
    expect(screen.getByText('Filter (1)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: HAT_TRICK })).toBeNull();
    expect(screen.getByRole('button', { name: CRANBERRY })).toBeTruthy();
  });

  it('switches Sort to Nearest and shows it as the value', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sort' }));
    expect(screen.getByRole('button', { name: 'By date', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Nearest' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Sort' }).props.accessibilityValue).toMatchObject({ text: 'Nearest' });
  });

  it('names the Clear button the same as it reads, and clears the filter', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Harbor Hawks' }));
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    expect(within(clear).getByText('Clear filters')).toBeTruthy();
    await fireEvent.press(clear);
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Filter' }).props.accessibilityValue).toMatchObject({ text: 'None' });
  });

  it('puts screen reader focus back on the button that opened the sheet', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
    jest.replaceProperty(Platform, 'OS', 'android');
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sort' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(focus).toHaveBeenCalledWith(expect.anything(), 'focus');
  });

  it('only offers teams that are in the list, A to Z', async () => {
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
    const labels = screen.getAllByRole('button').map((button) => button.props.accessibilityLabel);
    const teamOptions = labels.filter((label) => !label.includes(',') && !['Filter', 'Sort', 'Done'].includes(label));
    expect(teamOptions).toEqual(['Chesapeake Comets', 'Harbor Hawks']);
  });

  it('moves screen reader focus into the sheet when it opens', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
    await render(<UpcomingEventsList events={EVENTS} viewerRegionId={1} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sort' }));
    // The open sheet is the Modal around the "Sort" heading.
    let sortSheet = screen.getByRole('header', { name: 'Sort' }).parent;
    while (sortSheet && sortSheet.type !== 'Modal') sortSheet = sortSheet.parent;
    await fireEvent(sortSheet!, 'show');
    expect(focus).toHaveBeenCalledWith(expect.anything(), 'focus');
    expect(screen.getByRole('header', { name: 'Sort' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'By date', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nearest', selected: false })).toBeTruthy();
  });
});
