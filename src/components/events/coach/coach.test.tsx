import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SAMPLE_EVENT, SAMPLE_TEAM_NAME } from '../__fixtures__/sampleEvent';
import { CoachEventDetails } from './CoachEventDetails';
import { EditEventButton } from './EditEventButton';
import { EditNoteForm } from './EditNoteForm';
import { ReplyList } from './ReplyList';

jest.mock('@react-native-vector-icons/ionicons', () => ({ Ionicons: () => null }));

const REPLIES = {
  going: ['Avery C.', 'Jordan P.', 'Riley M.', 'Sam K.'],
  maybe: ['Morgan S.', 'Parker L.'],
  'cant-go': ['Reese T.'],
};

// Every stop a screen reader makes, in order, as "role: label".
const stops = () =>
  screen
    .getAllByRole(/header|button|text/)
    .filter((element) => element.props.accessibilityLabel)
    .map((element) => `${element.props.accessibilityRole}: ${element.props.accessibilityLabel}`);

describe('6450 coach Event Details', () => {
  const handlers = { onAddToCalendar: jest.fn(), onSeeAllReplies: jest.fn(), onEditNote: jest.fn() };

  it('follows the gold-pin reading order, with no Follow button', async () => {
    await render(<CoachEventDetails event={SAMPLE_EVENT} teamName={SAMPLE_TEAM_NAME} replies={REPLIES} {...handlers} />);
    expect(stops()).toEqual([
      'header: Haunted Hat Trick',
      `text: ${SAMPLE_TEAM_NAME}`,
      'text: Saturday, November 7, 10 AM to 12 PM',
      'text: College Park Ice Arena, 8500 Paint Branch Drive, College Park, Maryland',
      'button: Add to calendar',
      'header: Replies',
      'header: 4 going',
      'text: Avery C.',
      'text: Jordan P.',
      'text: Riley M.',
      'button: See all replies',
      'header: Note for players',
      'button: Edit note',
      `text: ${SAMPLE_EVENT.notes}`,
    ]);
  });

  it('opens See all replies and Edit note', async () => {
    await render(<CoachEventDetails event={SAMPLE_EVENT} teamName={SAMPLE_TEAM_NAME} replies={REPLIES} {...handlers} />);
    await fireEvent.press(screen.getByRole('button', { name: 'See all replies' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Edit note' }));
    expect(handlers.onSeeAllReplies).toHaveBeenCalled();
    expect(handlers.onEditNote).toHaveBeenCalled();
  });

  it('says when replies could not load, and when there is no note', async () => {
    await render(
      <CoachEventDetails event={{ ...SAMPLE_EVENT, notes: '' }} teamName={SAMPLE_TEAM_NAME} replies={null} {...handlers} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load replies. Try again later.");
    expect(screen.getByText('No note yet.')).toBeTruthy();
  });

  it('moves focus to the note when it changes (after Save note)', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
    const view = await render(<CoachEventDetails event={SAMPLE_EVENT} teamName={SAMPLE_TEAM_NAME} replies={REPLIES} {...handlers} />);
    expect(focus).not.toHaveBeenCalled();
    await view.rerender(
      <CoachEventDetails event={{ ...SAMPLE_EVENT, notes: 'New note' }} teamName={SAMPLE_TEAM_NAME} replies={REPLIES} {...handlers} />,
    );
    expect(focus).toHaveBeenCalledWith(expect.anything(), 'focus');
    focus.mockRestore();
  });
});

describe('Edit event (header)', () => {
  it('reads "Edit event" and is unavailable for now', async () => {
    await render(<EditEventButton />);
    expect(screen.getByRole('button', { name: 'Edit event', disabled: true })).toBeTruthy();
  });
});

describe('6451 Edit Note', () => {
  it('labels the field "Note for players", prefilled, and saves the trimmed note', async () => {
    const onSave = jest.fn();
    await render(<EditNoteForm initialNote="Old note" saving={false} saveFailed={false} onSave={onSave} />);
    const field = screen.getByLabelText('Note for players');
    expect(field.props.value).toBe('Old note');
    expect(field.props.multiline).toBe(true);
    await fireEvent.changeText(field, '  Bring both jerseys.  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
    expect(onSave).toHaveBeenCalledWith('Bring both jerseys.');
  });

  it('ignores Save while saving and shows an error if saving failed', async () => {
    const onSave = jest.fn();
    await render(<EditNoteForm initialNote="Old note" saving saveFailed onSave={onSave} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save the note. Try again.");
  });
});

describe('6452 Replies', () => {
  it('reads each group as a heading followed by its names, leaving out empty groups', async () => {
    await render(<ReplyList replies={{ ...REPLIES, maybe: [] }} />);
    expect(stops()).toEqual([
      'header: 4 going',
      'text: Avery C.',
      'text: Jordan P.',
      'text: Riley M.',
      'text: Sam K.',
      "header: 1 can't go",
      'text: Reese T.',
    ]);
  });

  it('says when nobody has replied', async () => {
    await render(<ReplyList replies={{ going: [], maybe: [], 'cant-go': [] }} />);
    expect(screen.getByText('No replies yet.')).toBeTruthy();
  });
});
