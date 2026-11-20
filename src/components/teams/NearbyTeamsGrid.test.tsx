import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { NearbyTeamsGrid } from './NearbyTeamsGrid';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/firebase', () => ({ auth: {}, db: {} }));

const TEAMS = [
  { id: 'team_201', name: 'Harbor Hawks', ageRange: 'Ages 12 to 40', regionId: 1, wins: 7, losses: 2 },
  { id: 'team_202', name: 'Chesapeake Comets', regionId: 1, wins: 3, losses: 4 },
];

async function renderGrid(props: Partial<Parameters<typeof NearbyTeamsGrid>[0]> = {}) {
  const onToggleFollow = jest.fn();
  await render(
    <NearbyTeamsGrid teams={TEAMS} followedTeamIds={['team_202']} onToggleFollow={onToggleFollow} {...props} />,
  );
  return { onToggleFollow };
}

describe('NearbyTeamsGrid', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads card then its Follow button, row by row', async () => {
    await renderGrid();
    const stops = screen.getAllByRole('button').map((element) => element.props.accessibilityLabel);
    expect(stops).toEqual([
      'Harbor Hawks, Ages 12 to 40, Washington',
      'Follow Harbor Hawks',
      'Chesapeake Comets, Washington',
      'Follow Chesapeake Comets',
    ]);
  });

  it('shows ages above the city only when the team has them', async () => {
    await renderGrid();
    expect(screen.getByText('Ages 12 to 40')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chesapeake Comets, Washington' })).toBeTruthy();
  });

  it('gives every card the same shape: long names stop at two lines but are read in full', async () => {
    const longName = 'Baltimore Blizzard Junior Development Squad';
    await renderGrid({ teams: [...TEAMS, { id: 'team_299', name: longName, regionId: 1, wins: 0, losses: 0 }] });
    for (const name of [longName, 'Harbor Hawks']) {
      expect(screen.getByText(name).props.numberOfLines).toBe(2);
    }
    expect(screen.getByRole('button', { name: `${longName}, Washington` })).toBeTruthy();
  });

  it('keeps the Follow label and marks following as selected (iOS)', async () => {
    await renderGrid();
    expect(screen.getByRole('button', { name: 'Follow Harbor Hawks', selected: false })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Follow Chesapeake Comets', selected: true })).toBeTruthy();
    expect(screen.getByText('Followed')).toBeTruthy();
    expect(screen.getByText('Follow')).toBeTruthy();
  });

  it('opens Team detail with the document ID', async () => {
    await renderGrid();
    await fireEvent.press(screen.getByRole('button', { name: 'Harbor Hawks, Ages 12 to 40, Washington' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/tabs/teams/[teamId]', params: { teamId: 'team_201' } });
  });

  it('asks to follow or unfollow based on the current state', async () => {
    const { onToggleFollow } = await renderGrid();
    await fireEvent.press(screen.getByRole('button', { name: 'Follow Harbor Hawks' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Follow Chesapeake Comets' }));
    expect(onToggleFollow).toHaveBeenNthCalledWith(1, 'team_201', true);
    expect(onToggleFollow).toHaveBeenNthCalledWith(2, 'team_202', false);
  });

  it('shows busy while saving and an alert if it fails', async () => {
    await renderGrid({ pendingTeamId: 'team_201', failedTeamId: 'team_202' });
    expect(screen.getByRole('button', { name: 'Follow Harbor Hawks', busy: true })).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't update Chesapeake Comets. Try again.");
  });

  it('is a toggle button on Android, checked with "Following" while followed', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await renderGrid();
    // The test library doesn't match `checked` on togglebutton, so check the props directly.
    const [unfollowed, followed] = screen.getAllByRole('togglebutton');
    expect(followed.props).toMatchObject({
      accessibilityLabel: 'Follow Chesapeake Comets',
      accessibilityState: { checked: true },
      accessibilityValue: { text: 'Following' },
    });
    expect(unfollowed.props.accessibilityState).toMatchObject({ checked: false });
    expect(unfollowed.props.accessibilityValue?.text).toBeUndefined();
  });
});
