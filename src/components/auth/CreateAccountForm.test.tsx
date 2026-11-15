import { act, fireEvent, isHiddenFromAccessibility, render, userEvent, waitFor, type RenderResult } from '@testing-library/react-native';
import { AccessibilityInfo, BackHandler, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { auth } from '@/firebase';
import { saveAccountProfile } from '@/services/authService';
import CreateAccountForm from './CreateAccountForm';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('@/firebase', () => ({ auth: { currentUser: null } }));
jest.mock('firebase/auth', () => ({ onAuthStateChanged: jest.fn() }));
jest.mock('@/services/authService', () => ({ saveAccountProfile: jest.fn() }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn() }));

const SIGNED_IN_USER = { uid: 'test-user', email: 'verified@example.com', displayName: 'Taylor Morgan' };

describe('three-step account onboarding', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS')!;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(auth, { currentUser: SIGNED_IN_USER });
    jest.mocked(saveAccountProfile).mockResolvedValue(undefined);
    jest.mocked(onAuthStateChanged).mockImplementation((_, listener) => {
      if (typeof listener === 'function') listener(auth.currentUser);
      return jest.fn();
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', platformDescriptor);
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  async function renderForm(): Promise<RenderResult> {
    const screen = await render(<CreateAccountForm />);
    return screen;
  }

  function readingOrder(screen: RenderResult) {
    return screen.container.queryAll(node => (
      typeof node.type === 'string' && Boolean(node.props.nativeID?.startsWith('account-')) &&
      Boolean(node.props.accessible === true || node.props.accessibilityRole) && !isHiddenFromAccessibility(node)
    )).map(node => node.props.nativeID);
  }

  // Sheets stay presented while they slide out; waiting keeps their exit inside act().
  async function waitForSheetsToClose(screen: RenderResult) {
    await waitFor(() => expect(screen.container.queryAll(node => node.type === 'Modal' && node.props.visible).length).toBe(0));
  }

  async function completeStepTwo(screen: RenderResult) {
    await fireEvent.press(screen.getByTestId('gender-select'));
    await fireEvent.press(screen.getByText('Woman'));
    await waitForSheetsToClose(screen);
    await fireEvent.changeText(screen.getByTestId('birthday'), '06/14/02');
    await fireEvent.press(screen.getByTestId('next-button'));
  }

  // Signed-in names prefill step 1; steps 2 and 3 need entry.
  async function goToStepThree() {
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('next-button'));
    await completeStepTwo(screen);
    return screen;
  }

  async function fillLiveForm() {
    const screen = await goToStepThree();
    await fireEvent.changeText(screen.getByTestId('phone-number'), '3015550142');
    return screen;
  }

  const focusedOn = (props: Record<string, unknown>) => expect.objectContaining({ props: expect.objectContaining(props) });

  it('shows photo actions and keeps entered values while moving between steps', async () => {
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('profile-photo-button'));
    expect(screen.getByText('Take photo')).toBeTruthy();
    expect(screen.getByText('Choose from library')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cancel'));
    await waitForSheetsToClose(screen);

    await fireEvent.changeText(screen.getByTestId('first-name'), 'Jordan');
    await fireEvent.press(screen.getByTestId('next-button'));
    await completeStepTwo(screen);
    expect(screen.getByTestId('phone-number')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('back-button'));
    expect(screen.getByRole('button', { name: 'Gender' }).props.accessibilityValue.text).toBe('Woman');
    expect(screen.getByTestId('birthday').props.value).toBe('06/14/02');
    await fireEvent.press(screen.getByTestId('back-button'));
    expect(screen.getByTestId('first-name').props.value).toBe('Jordan');
  });

  it('saves with optional fields empty and returns home from the completion screen', async () => {
    const screen = await fillLiveForm();
    await fireEvent.changeText(screen.getByTestId('hockey-number'), '');
    await fireEvent.press(screen.getByTestId('next-button'));
    await waitFor(() => expect(screen.getByText('Account complete')).toBeTruthy());
    expect(saveAccountProfile).toHaveBeenCalledWith(expect.objectContaining({ usaHockeyNumber: '', email: 'verified@example.com' }), null);
    await fireEvent.press(screen.getByText('Continue'));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('exposes the 9, 8, and 10 Figma reading stops', async () => {
    const screen = await renderForm();
    const header = ['account-back', 'account-title', 'account-close', 'account-progress', 'account-heading'];
    expect(readingOrder(screen)).toEqual([...header, 'account-photo', 'account-first-name', 'account-last-name', 'account-next-1']);
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(readingOrder(screen)).toEqual([...header, 'account-gender', 'account-birthday', 'account-next-2']);
    await completeStepTwo(screen);
    expect(readingOrder(screen)).toEqual([...header, 'account-email', 'account-phone-number', 'account-hockey-number', 'account-location', 'account-next-3']);
    expect(screen.getByLabelText('Email. Read only').props.editable).toBe(false);
    expect(screen.getAllByRole('switch')).toHaveLength(1);
  });

  it.each(['ios', 'android'])('labels the progress bar with the step without repeating it as a value on %s', async os => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
    const screen = await renderForm();
    const progress = screen.getByTestId('account-progress');
    expect(progress.props.accessibilityLabel).toBe('Step 1 of 3');
    expect(progress.props.tabIndex).toBeUndefined();
    if (os === 'ios') expect(progress.props.accessibilityValue).toBeUndefined();
    else expect(progress.props.accessibilityValue).toEqual({ min: 1, max: 3, now: 1 });
  });

  it('keeps placeholders out of speech and describes formats with hints', async () => {
    const screen = await goToStepThree();
    for (const input of screen.container.queryAll(node => node.type === 'TextInput')) expect(input.props.placeholder).toBeUndefined();
    const placeholder = screen.getByText('(###) ###-####', { includeHiddenElements: true });
    expect(isHiddenFromAccessibility(placeholder)).toBe(true);
    expect(screen.getByTestId('phone-number').props.accessibilityHint).toBe('10-digit phone number.');
    expect(screen.getByTestId('hockey-number').props.accessibilityHint).toBe('Numbers only.');
    await fireEvent.changeText(screen.getByTestId('phone-number'), '3015550142');
    expect(screen.queryByText('(###) ###-####', { includeHiddenElements: true })).toBeNull();
    await fireEvent.press(screen.getByTestId('back-button'));
    expect(screen.getByTestId('birthday').props.accessibilityHint).toBe('Enter month, day, and two-digit year.');
  });

  it('moves screen-reader focus to the current step after Next and Back', async () => {
    jest.useFakeTimers();
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent');
    const screen = await renderForm();
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-title' }), 'focus'));
    await fireEvent.press(screen.getByTestId('next-button'));
    await act(async () => jest.runOnlyPendingTimersAsync());
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-progress', accessibilityLabel: 'Step 2 of 3' }), 'focus'));
    await fireEvent.press(screen.getByTestId('back-button'));
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-progress', accessibilityLabel: 'Step 1 of 3' }), 'focus'));
  });

  it.each(['ios', 'android'])('focuses the first invalid input and announces an already-focused error once on %s', async os => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    const screen = await renderForm();
    const focusInput = jest.spyOn(TextInput.prototype, 'focus');
    const isInputFocused = jest.spyOn(TextInput.prototype, 'isFocused').mockReturnValue(false);
    await fireEvent.changeText(screen.getByTestId('first-name'), '');
    await fireEvent.changeText(screen.getByTestId('last-name'), '');
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(screen.getByLabelText('First name. Enter your first name.')).toBeTruthy();
    expect(focusInput).toHaveBeenCalledTimes(1);
    expect(focusInput.mock.contexts[0]).toEqual(focusedOn({ testID: 'first-name' }));
    expect(focusInput.mock.contexts).not.toContainEqual(focusedOn({ testID: 'last-name' }));
    expect(announce).not.toHaveBeenCalled();
    isInputFocused.mockReturnValue(true);
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Enter your first name.', { queue: true });
    expect(focusInput).toHaveBeenCalledTimes(1);
    expect(focusInput.mock.contexts[0]).toEqual(focusedOn({ testID: 'first-name' }));
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it.each(['ios', 'android'])('opens the photo sheet on its heading, hides the background, and restores its trigger on %s', async os => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent');
    const screen = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Add photo' }));
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.getByRole('header', { name: 'Profile photo' })).toBeTruthy();
    const modal = screen.container.queryAll(node => node.type === 'Modal').find(node => node.props.visible)!;
    const dismissModal = modal.props.onDismiss;
    await fireEvent(modal, 'show');
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ accessibilityRole: 'header', children: 'Profile photo' }), 'focus'));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    // The sheet stays presented while it slides out, then hides.
    expect(modal.props.visible).toBe(true);
    await waitForSheetsToClose(screen);
    if (os === 'ios') await act(async () => dismissModal());
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-photo' }), 'focus'));
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('focuses invalid gender instead of an outdated step-change focus request', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent');
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('next-button'));
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(screen.getByLabelText('Gender. Select a gender.')).toBeTruthy();
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-gender' }), 'focus'));
    expect(screen.getByLabelText('Birthday. Enter a valid birthday (MM/DD/YY).')).toBeTruthy();
    expect(announce).not.toHaveBeenCalled();
  });

  it('exposes selected gender, opens on the sheet heading, handles accessibility escape, and restores the gender control', async () => {
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent');
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('next-button'));
    await fireEvent.press(screen.getByRole('button', { name: 'Gender' }));
    await fireEvent.press(screen.getByText('Woman'));
    await fireEvent.press(screen.getByRole('button', { name: 'Gender' }));
    const selected = screen.getByRole('radio', { name: 'Woman' });
    expect(selected.props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Man' }).props.accessibilityState.checked).toBe(false);
    const modal = screen.container.queryAll(node => node.type === 'Modal').find(node => node.props.visible)!;
    const dismissModal = modal.props.onDismiss;
    await fireEvent(modal, 'show');
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ accessibilityRole: 'header', children: 'Gender' }), 'focus'));
    const sheet = screen.container.queryAll(node => Boolean(node.props.onAccessibilityEscape))[0];
    await fireEvent(sheet, 'accessibilityEscape');
    await waitForSheetsToClose(screen);
    await act(async () => dismissModal());
    await waitFor(() => expect(focus).toHaveBeenLastCalledWith(focusedOn({ nativeID: 'account-gender' }), 'focus'));
    expect(screen.getByRole('button', { name: 'Gender' }).props.accessibilityValue.text).toBe('Woman');
  });

  it('goes to the previous step on Android back and leaves the flow from step 1', async () => {
    let onBack: (() => boolean | null | undefined) | undefined;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, handler) => {
      onBack = () => handler({} as Parameters<typeof handler>[0]);
      return { remove: jest.fn() };
    });
    const screen = await renderForm();
    expect(onBack!()).toBe(false);
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(screen.getByTestId('gender-select')).toBeTruthy();
    let handled: boolean | null | undefined;
    await act(async () => { handled = onBack!(); });
    expect(handled).toBe(true);
    expect(screen.getByTestId('first-name')).toBeTruthy();
  });

  it('asks the user to sign in instead of flagging the read-only email when nobody is signed in', async () => {
    Object.assign(auth, { currentUser: null });
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    const screen = await renderForm();
    await fireEvent.changeText(screen.getByTestId('first-name'), 'Taylor');
    await fireEvent.changeText(screen.getByTestId('last-name'), 'Morgan');
    await fireEvent.press(screen.getByTestId('next-button'));
    await completeStepTwo(screen);
    await fireEvent.changeText(screen.getByTestId('phone-number'), '3015550142');
    await fireEvent.press(screen.getByTestId('next-button'));
    expect(screen.getByText('Sign in before completing your account.')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Sign in before completing your account.', { queue: true });
    expect(screen.getByLabelText('Email. Read only')).toBeTruthy();
    expect(saveAccountProfile).not.toHaveBeenCalled();
  });

  it('waits for a live profile save before reporting completion', async () => {
    let finishSave!: () => void;
    jest.mocked(saveAccountProfile).mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
    const screen = await fillLiveForm();
    // userEvent follows the native press sequence without awaiting the pending save.
    await userEvent.press(screen.getByTestId('next-button'));
    expect(saveAccountProfile).toHaveBeenCalledWith(expect.objectContaining({ email: 'verified@example.com', firstName: 'Taylor' }), null);
    expect(screen.queryByText('Account complete')).toBeNull();
    expect(screen.getByTestId('next-button').props.accessibilityState.busy).toBe(true);
    await act(async () => finishSave());
    expect(screen.getByText('Your profile has been saved.')).toBeTruthy();
  });

  it('keeps live input available after a failed save and allows retry', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    jest.mocked(saveAccountProfile).mockRejectedValueOnce(new Error('Could not save your account.'));
    const screen = await fillLiveForm();
    await fireEvent.press(screen.getByTestId('next-button'));
    await waitFor(() => expect(screen.getByText('Could not save your account.')).toBeTruthy());
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Could not save your account.', { queue: true });
    expect(screen.getByTestId('phone-number').props.value).toBe('(301) 555-0142');
    expect(screen.queryByText('Account complete')).toBeNull();
    await fireEvent.press(screen.getByTestId('next-button'));
    await waitFor(() => expect(screen.getByText('Account complete')).toBeTruthy());
  });

  it('uses a single polite web live region for save errors without a native announcement', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    jest.mocked(saveAccountProfile).mockRejectedValueOnce(new Error('Could not save your account.'));
    const screen = await fillLiveForm();
    await fireEvent.press(screen.getByTestId('next-button'));
    await waitFor(() => expect(screen.getByText('Could not save your account.')).toBeTruthy());
    expect(screen.getByTestId('account-feedback').props.accessibilityLiveRegion).toBe('polite');
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(announce).not.toHaveBeenCalled();
  });

  it('returns home from the close control', async () => {
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('close-button'));
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('opens the library picker once the photo sheet is dismissed and accepts a selected photo', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as never);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', base64: 'YWJj', mimeType: 'image/jpeg' }],
    } as ImagePicker.ImagePickerResult);
    const screen = await renderForm();
    await fireEvent.press(screen.getByTestId('profile-photo-button'));
    const modal = screen.container.queryAll(node => node.type === 'Modal').find(node => node.props.visible)!;
    const dismissModal = modal.props.onDismiss;
    await fireEvent.press(screen.getByText('Choose from library'));
    await waitForSheetsToClose(screen);
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    await act(async () => dismissModal());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change photo' })).toBeTruthy());
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: true }));
  });

  it('keeps location off when permission is denied, then enables it when granted', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValueOnce({ granted: false } as never)
      .mockResolvedValueOnce({ granted: true } as never);
    const screen = await goToStepThree();
    await fireEvent.press(screen.getByTestId('location-toggle'));
    await waitFor(() => expect(screen.getByTestId('location-toggle').props.accessibilityState.busy).toBe(false));
    expect(screen.getByTestId('location-toggle').props.accessibilityState.checked).toBe(false);
    await fireEvent.press(screen.getByTestId('location-toggle'));
    await waitFor(() => expect(screen.getByTestId('location-toggle').props.accessibilityState.checked).toBe(true));
  });
});
