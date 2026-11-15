import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SAMPLE_EVENT, SAMPLE_TEAM_NAME } from './__fixtures__/sampleEvent';
import { EventDetails } from './EventDetails';

jest.mock('@react-native-vector-icons/ionicons', () => ({ Ionicons: () => null }));

async function renderDetails(overrides: Partial<typeof SAMPLE_EVENT> = {}) {
  const onAddToCalendar = jest.fn();
  await render(
    <EventDetails
      event={{ ...SAMPLE_EVENT, ...overrides }}
      teamName={SAMPLE_TEAM_NAME}
      onAddToCalendar={onAddToCalendar}
    />,
  );
  return { onAddToCalendar };
}

describe('event details content', () => {
  it('shows the event and reads each block as one item', async () => {
    await renderDetails();
    expect(screen.getByRole('header', { name: 'Haunted Hat Trick' })).toBeTruthy();
    expect(screen.getByText(SAMPLE_TEAM_NAME)).toBeTruthy();
    expect(screen.getByLabelText('Saturday, November 7, 10 AM to 12 PM')).toBeTruthy();
    expect(
      screen.getByLabelText('College Park Ice Arena, 8500 Paint Branch Drive, College Park, Maryland'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Note from coach. Bring white and dark jerseys. We'll split into two groups."),
    ).toBeTruthy();
  });

  it('hides the coach note when the event has none', async () => {
    await renderDetails({ notes: '' });
    expect(screen.queryByText('Note from coach')).toBeNull();
  });

  it('opens the calendar from Add to calendar', async () => {
    const { onAddToCalendar } = await renderDetails();
    await fireEvent.press(screen.getByRole('button', { name: 'Add to calendar' }));
    expect(onAddToCalendar).toHaveBeenCalledTimes(1);
  });
});

describe('follow button', () => {
  it('switches from Follow to Followed and announces it', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    await renderDetails();

    await fireEvent.press(screen.getByRole('button', { name: 'Follow Baltimore Blades' }));

    expect(screen.getByRole('button', { name: 'Following Baltimore Blades' })).toBeTruthy();
    expect(screen.getByText('Followed')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Following Baltimore Blades');
  });

  it('goes back to Follow on a second press', async () => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    await renderDetails();

    await fireEvent.press(screen.getByRole('button', { name: 'Follow Baltimore Blades' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Following Baltimore Blades' }));

    expect(screen.getByRole('button', { name: 'Follow Baltimore Blades' })).toBeTruthy();
  });
});

describe('RSVP', () => {
  it('starts with three options and no reply', async () => {
    await renderDetails();
    expect(screen.getByRole('header', { name: 'Are you going?' })).toBeTruthy();
    for (const label of ['Going', 'Maybe', "Can't go"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.queryByLabelText(/Your reply/)).toBeNull();
    expect(screen.queryByLabelText('Edit your reply')).toBeNull();
  });

  it('replaces the options with the reply and a pencil after choosing', async () => {
    await renderDetails();
    await fireEvent.press(screen.getByLabelText('Maybe'));

    expect(screen.getByLabelText('Your reply: Maybe')).toBeTruthy();
    expect(screen.getByLabelText('Edit your reply')).toBeTruthy();
    expect(screen.queryByLabelText('Going')).toBeNull();
    expect(screen.queryByLabelText("Can't go")).toBeNull();
  });

  it('only the pencil changes the reply: it brings the options back with the reply selected', async () => {
    await renderDetails();
    await fireEvent.press(screen.getByLabelText('Going'));

    // Pressing the reply itself does nothing.
    await fireEvent.press(screen.getByLabelText('Your reply: Going'));
    expect(screen.getByLabelText('Your reply: Going')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Edit your reply'));
    expect(screen.queryByLabelText(/Your reply/)).toBeNull();
    for (const label of ['Going', 'Maybe', "Can't go"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Going', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Maybe', selected: false })).toBeTruthy();
  });

  it('saves a new pick from editing and collapses back to the bar', async () => {
    await renderDetails();
    await fireEvent.press(screen.getByLabelText('Going'));
    await fireEvent.press(screen.getByLabelText('Edit your reply'));
    await fireEvent.press(screen.getByLabelText("Can't go"));

    expect(screen.getByLabelText("Your reply: Can't go")).toBeTruthy();
    expect(screen.queryByLabelText('Maybe')).toBeNull();
  });
});
