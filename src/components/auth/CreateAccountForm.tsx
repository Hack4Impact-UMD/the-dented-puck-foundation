import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type Ref, type RefObject } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type PressableInstance,
  type TextInputInstance,
  type TextInstance,
  type ViewInstance,
} from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/firebase';
import { saveAccountProfile, type AccountPhoto } from '@/services/authService';
import useReducedMotion from '@/hooks/useReducedMotion';
import BackIcon from '@/assets/create-account/back.svg';
import CloseIcon from '@/assets/create-account/close.svg';
import AddPhotoIcon from '@/assets/create-account/add_photo.svg';
import CameraIcon from '@/assets/create-account/camera_badge.svg';
import ChevronIcon from '@/assets/create-account/gender_chevron.svg';
import TakePhotoIcon from '@/assets/create-account/photo_take.svg';
import LibraryIcon from '@/assets/create-account/photo_library.svg';
import SlidingPages from './SlidingPages';
import {
  formatBirthday,
  formatPhone,
  validateAccountStep,
  type AccountErrors,
  type AccountField,
  type AccountForm,
} from '@/utils/validation';

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const STEPS = [1, 2, 3] as const;
// VoiceOver and TalkBack drop focus requests sent before a press, step change,
// or sheet transition settles. Tune on device if focus lands late or not at all.
const SCREEN_READER_FOCUS_DELAY_MS = 300;
type FocusTarget = ViewInstance | TextInstance | TextInputInstance | PressableInstance;

function focusAccessibility(target: FocusTarget | null) {
  if (!target) return;
  if (Platform.OS === 'web') target.focus();
  else AccessibilityInfo.sendAccessibilityEvent(
    target as unknown as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0], 'focus',
  );
}
const EMPTY_FORM: AccountForm = {
  firstName: '', lastName: '', gender: '', birthday: '', email: '',
  phoneNumber: '', usaHockeyNumber: '', allowLocation: false,
};

// Dented Puck / Hi-Fi Screens - Annotated (641:291): frames 2200, 2300, and 2400.
// All three frames share /auth/create-account; local state selects the step.
// Render order follows the Figma reading-order annotations.

function AccountProgress({ step, progressRef }: { step: 1 | 2 | 3; progressRef: Ref<ViewInstance> }) {
  return (
    <View
      className="flex-row gap-1.5 h-1.5 mb-5"
      ref={progressRef}
      nativeID="account-progress"
      {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
      testID="account-progress"
      accessibilityRole="progressbar"
      accessible
      accessibilityLabel={`Step ${step} of 3`}
      // iOS reads value text, or else a computed percentage, after the label;
      // the label already says the step, so iOS gets no value.
      accessibilityValue={Platform.OS === 'ios' ? undefined : { min: 1, max: 3, now: step }}
    >
      {STEPS.map(index => (
        <View
          key={index}
          className={`flex-1 h-1.5 rounded-full ${index <= step ? 'bg-brand' : 'bg-[#6B6B6B]'}`}
        />
      ))}
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  editable?: boolean;
  testID: string;
  inputRef?: Ref<TextInputInstance>;
  active?: boolean;
  onSubmitEditing?: () => void;
};

function Field({ label, value, onChangeText, error, placeholder, hint, keyboardType, editable = true, testID, inputRef, active = true, onSubmitEditing }: FieldProps) {
  return (
    <View className="min-h-[90px] mb-5">
      <Text aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-white text-lg leading-[26px] font-sans-bold mb-2">
        {label}
      </Text>
      <View>
        <TextInput
          ref={inputRef}
          nativeID={`account-${testID}`}
          testID={testID}
          accessible
          accessibilityLabel={`${label}${editable ? '' : '. Read only'}${error ? `. ${error}` : ''}`}
          accessibilityHint={hint}
          aria-invalid={!!error}
          tabIndex={active ? 0 : -1}
          className={`min-h-14 w-full rounded border-2 bg-surface-field text-white text-lg font-sans px-4 py-2.5 ${
            !editable ? 'bg-[#262626] border-line-dark border' : error ? 'border-danger-dark' : 'border-white'
          }`}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCorrect={false}
          editable={editable && active}
          returnKeyType="next"
          onSubmitEditing={onSubmitEditing}
        />
        {/* Drawn over the input rather than passed as `placeholder`: screen readers read
            a placeholder as the empty field's value ("First name, First name", "number sign…"). */}
        {!value && !!placeholder && (
          <View pointerEvents="none" aria-hidden className="absolute inset-0 justify-center px-5">
            <Text numberOfLines={1} className="text-ink-subtle text-lg font-sans">
              {placeholder}
            </Text>
          </View>
        )}
      </View>
      {!!error && <Text aria-hidden className="text-danger-dark text-[13px] font-sans mt-1">{error}</Text>}
    </View>
  );
}

type SheetProps = {
  title: string;
  visible: boolean;
  reduceMotion: boolean;
  onClose: () => void;
  onShow: () => void;
  onDismiss: () => void;
  titleRef: Ref<TextInstance>;
  children: React.ReactNode;
};

function Sheet({ title, visible, reduceMotion, onClose, onShow, onDismiss, titleRef, children }: SheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  // Stays true through the closing slide so the Modal hides only once the panel is off screen.
  const [rendered, setRendered] = useState(visible);
  const [panelHeight, setPanelHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !rendered) setRendered(true);

  const hide = useEffectEvent(() => {
    setRendered(false);
    // Android's Modal has no onDismiss callback; report it once the sheet is gone.
    if (Platform.OS === 'android') onDismiss();
  });

  useEffect(() => {
    if (!rendered) return;
    // Wait for the panel's height so it slides in from just below the screen edge.
    if (visible && !panelHeight && !reduceMotion) return;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) hide();
    });
    return () => animation.stop();
  }, [visible, rendered, panelHeight, reduceMotion, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [panelHeight || windowHeight, 0] });

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={onClose}
      onShow={onShow} onDismiss={onDismiss}>
      <View className="flex-1 justify-end" pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View className="absolute inset-0 bg-black/70" style={{ opacity: progress }}>
          <Pressable className="flex-1" onPress={onClose} accessible={false} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          aria-modal
          role={Platform.OS === 'web' ? 'dialog' : undefined}
          accessibilityLabel={title}
          onAccessibilityEscape={onClose}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          className={`max-h-[85%] bg-[#1F1F1F] border-t border-line-dark rounded-t-2xl px-4 pt-3 pb-10 ${
            title === 'Profile photo' ? 'min-h-[304px]' : ''
          }`}
          style={{ transform: [{ translateY }] }}
        >
          <View aria-hidden className="w-10 h-1.5 rounded-full bg-[#8C8C8C] self-center mb-4" />
          {/* The sheet's first reading stop, so screen readers announce what opened. */}
          <Text ref={titleRef} accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} className="text-line-subtle text-lg leading-[22px] font-sans-bold text-center mb-3">
            {title}
          </Text>
          <ScrollView className="flex-shrink" keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SheetRow({ label, onPress, icon, selected }: { label: string; onPress: () => void; icon?: React.ReactNode; selected?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
      className="min-h-16 py-3 flex-row items-center border-b border-line-dark active:opacity-70"
    >
      {icon && <View aria-hidden className="w-11 items-start">{icon}</View>}
      <Text className="text-white text-lg font-sans flex-shrink">{label}</Text>
    </Pressable>
  );
}

export default function CreateAccountForm() {
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photo, setPhoto] = useState<AccountPhoto>(null);
  const [sheet, setSheet] = useState<'photo' | 'gender' | null>(null);
  const [message, setMessage] = useState('');
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const [validationFocus, setValidationFocus] = useState<{ field: AccountField; sequence: number } | null>(null);
  const [locationPending, setLocationPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduceMotion = useReducedMotion();
  const titleRef = useRef<TextInstance>(null);
  const progressRef = useRef<ViewInstance>(null);
  const completionRef = useRef<TextInstance>(null);
  const photoButtonRef = useRef<PressableInstance>(null);
  const genderButtonRef = useRef<PressableInstance>(null);
  const photoSheetTitleRef = useRef<TextInstance>(null);
  const genderSheetTitleRef = useRef<TextInstance>(null);
  const fieldRefs = useRef<Partial<Record<AccountField, TextInputInstance | null>>>({});
  const returnFocusRef = useRef<RefObject<FocusTarget | null> | null>(null);
  const pendingPhotoSource = useRef<'camera' | 'library' | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedScreen = useRef<string | null>(null);

  const cancelFocusRequest = useCallback(() => {
    if (focusTimer.current !== null) clearTimeout(focusTimer.current);
    focusTimer.current = null;
  }, []);

  const requestFocus = useCallback((target: RefObject<FocusTarget | null>, afterFocus?: () => void) => {
    cancelFocusRequest();
    focusTimer.current = setTimeout(() => {
      focusTimer.current = null;
      focusAccessibility(target.current);
      afterFocus?.();
    }, SCREEN_READER_FOCUS_DELAY_MS);
  }, [cancelFocusRequest]);

  const restoreSheetFocus = useCallback(() => {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target) requestFocus(target);
  }, [requestFocus]);

  useEffect(() => cancelFocusRequest, [cancelFocusRequest]);

  useLayoutEffect(() => {
    if (!fontsLoaded && !fontError) return;
    const screen = complete ? 'complete' : `step-${step}`;
    if (screen === lastFocusedScreen.current) return;
    const initial = lastFocusedScreen.current === null;
    lastFocusedScreen.current = screen;
    requestFocus(complete ? completionRef : initial ? titleRef : progressRef);
  }, [complete, step, fontsLoaded, fontError, requestFocus]);

  useLayoutEffect(() => {
    if (!validationFocus) return;
    cancelFocusRequest();
    const input = fieldRefs.current[validationFocus.field];
    if (input) {
      if (validationFocus.field === 'email') focusAccessibility(input);
      else if (!input.isFocused()) input.focus();
    } else if (validationFocus.field === 'gender') {
      focusAccessibility(genderButtonRef.current);
    }
  }, [validationFocus, cancelFocusRequest]);

  useEffect(() => {
    // Web has one polite live region; native platforms receive one explicit
    // announcement. Do not combine these with an alert for the same feedback.
    // `queue` (iOS only) waits for current speech, such as a focus move, instead
    // of interrupting it.
    if (message && Platform.OS !== 'web') AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
  }, [message, feedbackSequence]);

  useEffect(() => {
    // Android back, including TalkBack's back gesture, mirrors the Back button
    // between steps. Open sheets handle back through Modal.onRequestClose.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 1 || sheet || complete) return false;
      if (!busy) goBack();
      return true;
    });
    return () => subscription.remove();
  });

  function showFeedback(text: string) {
    setMessage(text);
    setFeedbackSequence(current => current + 1);
  }

  function openSheet(kind: 'photo' | 'gender') {
    cancelFocusRequest();
    returnFocusRef.current = null;
    pendingPhotoSource.current = null;
    Keyboard.dismiss();
    setSheet(kind);
  }

  function closeSheet() {
    // The sheet ignores input while it slides out, but escape and back can still arrive.
    if (!sheet) return;
    returnFocusRef.current = sheet === 'photo' ? photoButtonRef : genderButtonRef;
    setSheet(null);
  }

  function dismissPhotoSheet() {
    const source = pendingPhotoSource.current;
    pendingPhotoSource.current = null;
    if (source) launchPhotoPicker(source);
    else restoreSheetFocus();
  }

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      const parts = (user?.displayName || '').trim().split(/\s+/);
      setForm(current => ({
        ...current,
        firstName: current.firstName || parts[0] || '',
        lastName: current.lastName || parts.slice(1).join(' '),
        email: user?.email || '',
      }));
    });
  }, []);

  function update(field: AccountField, value: string | boolean) {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setMessage('');
  }

  function closeFlow() {
    router.replace('/');
  }

  function goBack() {
    if (step === 1) closeFlow();
    else {
      Keyboard.dismiss();
      setStep((step - 1) as 1 | 2);
      setErrors({});
      setMessage('');
    }
  }

  function choosePhoto(source: 'camera' | 'library') {
    // The picker opens from dismissPhotoSheet: iOS can't present it while the
    // sheet's Modal is still sliding out, and Android would show it underneath.
    pendingPhotoSource.current = source;
    returnFocusRef.current = null;
    setSheet(null);
    setMessage('');
  }

  async function launchPhotoPicker(source: 'camera' | 'library') {
    let feedback = '';
    try {
      if (Platform.OS !== 'web') {
        const permission = source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          feedback = `Allow ${source === 'camera' ? 'camera' : 'photo library'} access to add a profile photo.`;
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
      };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.base64) throw new Error('Could not prepare that photo. Please choose another.');
        setPhotoUri(asset.uri);
        setPhoto({ base64: asset.base64, mimeType: asset.mimeType || 'image/jpeg' });
      }
    } catch (error) {
      feedback = error instanceof Error ? error.message : 'Could not open photos. Please try again.';
    } finally {
      requestFocus(photoButtonRef, () => { if (feedback) showFeedback(feedback); });
    }
  }

  async function toggleLocation(value: boolean) {
    if (busy || locationPending) return;
    if (!value) return update('allowLocation', false);
    setLocationPending(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) update('allowLocation', true);
      else showFeedback('Location access was not granted. You can finish without it.');
    } catch {
      showFeedback('Location access is unavailable. You can finish without it.');
    } finally {
      setLocationPending(false);
    }
  }

  async function advance() {
    if (busy || locationPending) return;
    setMessage('');
    if (step === 3 && !form.email) {
      // Email comes from the signed-in account and can't be edited here.
      showFeedback('Sign in before completing your account.');
      return;
    }
    const nextErrors = validateAccountStep(form, step);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const field = Object.keys(nextErrors)[0] as AccountField;
      const input = fieldRefs.current[field];
      if (input?.isFocused() || (!input && field !== 'gender')) showFeedback(nextErrors[field]!);
      setValidationFocus(current => ({ field, sequence: (current?.sequence || 0) + 1 }));
      return;
    }
    if (step < 3) {
      Keyboard.dismiss();
      setStep((step + 1) as 2 | 3);
      setMessage('');
      return;
    }
    setMessage('');
    setBusy(true);
    try {
      await saveAccountProfile(form, photo);
      setComplete(true);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Could not save your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center px-4">
          <ActivityIndicator accessibilityLabel="Loading create account screen" color="#FFD101" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar style="light" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        aria-hidden={sheet !== null} accessibilityElementsHidden={sheet !== null}
        importantForAccessibility={sheet ? 'no-hide-descendants' : 'auto'}>
        <View className="flex-1 w-full max-w-[412px] self-center bg-black" nativeID="account-screen" testID="account-screen">
          {complete ? (
            <View className="flex-1 justify-center px-4">
              <Text ref={completionRef} nativeID="account-complete" accessible accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} className="text-white text-[26px] leading-[34px] font-sans-bold text-center mb-7">
                Account complete
              </Text>
              <Text className="text-line-subtle text-center text-base leading-6 font-sans mb-6">
                Your profile has been saved.
              </Text>
              <Pressable nativeID="account-continue" accessibilityRole="button" accessibilityLabel="Continue" accessibilityHint="Returns to the home screen" className="min-h-14 py-3 px-3 rounded bg-brand items-center justify-center mt-1 active:opacity-90" onPress={closeFlow}>
                <Text className="text-on-brand text-xl leading-7 font-sans-bold">Continue</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="min-h-[60px] border-b border-line-dark flex-row items-center justify-between px-2">
                <Pressable nativeID="account-back" onPress={goBack} disabled={busy} accessibilityRole="button" accessibilityLabel="Back" accessibilityHint={step === 1 ? 'Returns to the home screen' : `Returns to step ${step - 1} of 3`} accessibilityState={{ disabled: busy }} className="h-12 w-12 items-center justify-center active:opacity-70" testID="back-button">
                  <View aria-hidden><BackIcon width={24} height={24} /></View>
                </Pressable>
                <View className="flex-1">
                  <Text ref={titleRef} nativeID="account-title" accessible accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} className="text-white text-[21px] leading-[30px] font-sans-bold text-center">
                    Create an account
                  </Text>
                </View>
                <Pressable nativeID="account-close" onPress={closeFlow} disabled={busy} accessibilityRole="button" accessibilityLabel="Close" accessibilityHint="Closes account setup and returns home" accessibilityState={{ disabled: busy }} className="h-12 w-12 items-center justify-center active:opacity-70" testID="close-button">
                  <View aria-hidden><CloseIcon width={24} height={24} /></View>
                </Pressable>
              </View>
              <View className="px-4 pt-4">
                <AccountProgress step={step} progressRef={progressRef} />
                <View>
                  <Text nativeID="account-heading" accessible accessibilityRole="header" className="text-white text-[26px] leading-[34px] font-sans-bold text-center mb-6">
                    Your info
                  </Text>
                </View>
              </View>
              <SlidingPages activeIndex={step - 1} reduceMotion={reduceMotion}>
                {STEPS.map(page => (
                  <ScrollView key={page} contentContainerClassName="px-4 pt-1 pb-12" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {page === 1 && (
                      <>
                        <Pressable ref={photoButtonRef} nativeID="account-photo" className="self-center w-[88px] h-[88px] rounded-full border-2 border-dashed border-[#8C8C8C] bg-[#262626] items-center justify-center -mt-1 mb-7 active:opacity-80" onPress={() => openSheet('photo')} disabled={busy || page !== step} accessibilityRole="button" accessibilityLabel={photoUri ? 'Change photo' : 'Add photo'} accessibilityHint="Opens options to take a photo or choose one from your library" accessibilityState={{ disabled: busy }} testID="profile-photo-button">
                          <View aria-hidden>{photoUri ? <Image source={{ uri: photoUri }} className="w-[84px] h-[84px] rounded-full" /> : <AddPhotoIcon width={40} height={40} />}</View>
                          <View aria-hidden className="absolute -bottom-[3px] -right-1 w-8 h-8 rounded-full bg-brand items-center justify-center">
                            <CameraIcon width={18} height={18} />
                          </View>
                        </Pressable>
                        <Field label="First name" inputRef={node => { fieldRefs.current.firstName = node; }} active={page === step && !busy} onSubmitEditing={() => fieldRefs.current.lastName?.focus()} testID="first-name" value={form.firstName} onChangeText={value => update('firstName', value)} error={errors.firstName} placeholder="First name" />
                        <Field label="Last name" inputRef={node => { fieldRefs.current.lastName = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="last-name" value={form.lastName} onChangeText={value => update('lastName', value)} error={errors.lastName} placeholder="Last name" />
                      </>
                    )}

                    {page === 2 && (
                      <>
                        <View className="min-h-[90px] mb-5">
                          <Text aria-hidden className="text-white text-lg leading-[26px] font-sans-bold mb-2">Gender</Text>
                          <Pressable
                            ref={genderButtonRef}
                            nativeID="account-gender"
                            accessibilityRole="button"
                            accessibilityLabel={errors.gender ? `Gender. ${errors.gender}` : 'Gender'}
                            accessibilityHint="Opens the list of gender options"
                            accessibilityState={{ expanded: sheet === 'gender', disabled: busy }}
                            disabled={busy || page !== step}
                            accessibilityValue={{ text: form.gender || 'Not selected' }}
                            className={`min-h-14 w-full rounded border-2 bg-surface-field px-4 py-2.5 flex-row items-center justify-between active:opacity-80 ${
                              errors.gender ? 'border-danger-dark' : 'border-white'
                            }`}
                            onPress={() => openSheet('gender')}
                            testID="gender-select"
                          >
                            <Text className={`text-lg font-sans ${form.gender ? 'text-white' : 'text-ink-subtle'}`}>
                              {form.gender || 'Select'}
                            </Text>
                            <View aria-hidden><ChevronIcon width={24} height={24} /></View>
                          </Pressable>
                          {!!errors.gender && <Text aria-hidden className="text-danger-dark text-[13px] font-sans mt-1">{errors.gender}</Text>}
                        </View>
                        <Field label="Birthday" inputRef={node => { fieldRefs.current.birthday = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="birthday" value={form.birthday} onChangeText={value => update('birthday', formatBirthday(value))} error={errors.birthday} placeholder="MM/DD/YY" hint="Enter month, day, and two-digit year." keyboardType="number-pad" />
                      </>
                    )}

                    {page === 3 && (
                      <>
                        <Field label="Email" inputRef={node => { fieldRefs.current.email = node; }} active={page === step} testID="email" value={form.email} onChangeText={value => update('email', value)} error={errors.email} editable={false} />
                        <Field label="Phone number" inputRef={node => { fieldRefs.current.phoneNumber = node; }} active={page === step && !busy} onSubmitEditing={() => fieldRefs.current.usaHockeyNumber?.focus()} testID="phone-number" value={form.phoneNumber} onChangeText={value => update('phoneNumber', formatPhone(value))} error={errors.phoneNumber} placeholder="(###) ###-####" hint="10-digit phone number." keyboardType="phone-pad" />
                        <Field label="USA hockey number (Optional)" inputRef={node => { fieldRefs.current.usaHockeyNumber = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="hockey-number" value={form.usaHockeyNumber} onChangeText={value => update('usaHockeyNumber', value)} placeholder="#########" hint="Numbers only." keyboardType="number-pad" />
                        <Pressable nativeID="account-location" className="min-h-[132px] mb-5 px-4 py-2 active:opacity-80" accessibilityRole="switch" accessibilityLabel="Allow location access" accessibilityHint="We’ll use your location to show you teams and events near you."
                          accessibilityState={{ checked: form.allowLocation, disabled: busy || locationPending, busy: locationPending }}
                          disabled={busy || locationPending || page !== step} onPress={() => toggleLocation(!form.allowLocation)} testID="location-toggle">
                          <View className="min-h-11 relative pr-16 flex-row items-center justify-between">
                            <Text aria-hidden className="text-white text-lg leading-[26px] font-sans-bold">Allow location access</Text>
                            <View pointerEvents="none" aria-hidden className="absolute top-0 right-0">
                              <Switch accessible={false} value={form.allowLocation} trackColor={{ false: '#6B6B6B', true: '#FFD101' }} thumbColor={form.allowLocation ? '#010101' : '#FFFFFF'} />
                            </View>
                          </View>
                          <Text aria-hidden className="text-ink-subtle text-lg leading-6 font-sans mt-4 max-w-[348px]">
                            We’ll use your location to show you teams and events near you.
                          </Text>
                        </Pressable>
                      </>
                    )}
                    {page === step && (
                      <View nativeID="account-feedback" testID="account-feedback" accessible={!!message}
                        accessibilityLiveRegion={Platform.OS === 'web' ? 'polite' : 'none'}>
                        {!!message && <Text key={feedbackSequence} className="text-danger-dark text-sm leading-5 font-sans mb-4">{message}</Text>}
                      </View>
                    )}
                    <Pressable
                      nativeID={`account-next-${page}`}
                      accessibilityRole="button"
                      accessibilityLabel={busy ? 'Saving account' : page === 3 ? 'Complete account' : 'Next'}
                      accessibilityState={{ disabled: busy || locationPending, busy }}
                      disabled={busy || locationPending || page !== step}
                      className={`min-h-14 py-3 px-3 rounded bg-brand items-center justify-center mt-1 active:opacity-90 ${busy ? 'opacity-65' : ''}`}
                      onPress={advance}
                      testID="next-button"
                    >
                      <Text className="text-on-brand text-xl leading-7 font-sans-bold">
                        {busy ? 'Saving…' : page === 3 ? 'Complete account' : 'Next'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                ))}
              </SlidingPages>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      <Sheet title="Profile photo" visible={sheet === 'photo'} reduceMotion={reduceMotion} onClose={closeSheet} onShow={() => requestFocus(photoSheetTitleRef)} onDismiss={dismissPhotoSheet} titleRef={photoSheetTitleRef}>
        <SheetRow label="Take photo" icon={<TakePhotoIcon width={24} height={24} />} onPress={() => choosePhoto('camera')} />
        <SheetRow label="Choose from library" icon={<LibraryIcon width={24} height={24} />} onPress={() => choosePhoto('library')} />
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" className="min-h-14 py-3 rounded bg-brand items-center justify-center mt-4 active:opacity-90" onPress={closeSheet}>
          <Text className="text-on-brand text-xl leading-7 font-sans-bold">Cancel</Text>
        </Pressable>
      </Sheet>
      <Sheet title="Gender" visible={sheet === 'gender'} reduceMotion={reduceMotion} onClose={closeSheet} onShow={() => requestFocus(genderSheetTitleRef)} onDismiss={restoreSheetFocus} titleRef={genderSheetTitleRef}>
        {GENDERS.map(gender => <SheetRow key={gender} label={gender} selected={form.gender === gender}
          onPress={() => { update('gender', gender); closeSheet(); }} />)}
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" className="min-h-14 py-3 rounded bg-brand items-center justify-center mt-4 active:opacity-90" onPress={closeSheet}>
          <Text className="text-on-brand text-xl leading-7 font-sans-bold">Cancel</Text>
        </Pressable>
      </Sheet>
    </SafeAreaView>
  );
}
