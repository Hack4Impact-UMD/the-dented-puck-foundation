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
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
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
import { saveAccountProfile, type AccountPhoto } from '@/services/profileService';
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
} from './createAccountValidation';

const GOLD = '#FFD101';
const FONT_REGULAR = 'AtkinsonRegular';
const FONT_BOLD = 'AtkinsonBold';
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const STEPS = [1, 2, 3] as const;
// VoiceOver and TalkBack drop focus requests sent before a press, step change,
// or sheet transition settles. Tune on device if focus lands late or not at all.
const SCREEN_READER_FOCUS_DELAY_MS = 300;
type FocusTarget = View | Text | TextInput;

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

function AccountProgress({ step, progressRef }: { step: 1 | 2 | 3; progressRef: Ref<View> }) {
  return (
    <View
      style={styles.progress}
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
          style={[
            styles.progressSegment,
            { backgroundColor: index <= step ? GOLD : '#6B6B6B' },
          ]}
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
  inputRef?: Ref<TextInput>;
  active?: boolean;
  onSubmitEditing?: () => void;
};

function Field({ label, value, onChangeText, error, placeholder, hint, keyboardType, editable = true, testID, inputRef, active = true, onSubmitEditing }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.label}>{label}</Text>
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
          style={[styles.input, !editable && styles.readOnlyInput, !!error && styles.errorInput]}
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
          <View pointerEvents="none" aria-hidden style={styles.placeholderOverlay}>
            <Text numberOfLines={1} style={[styles.selectText, styles.placeholderText]}>{placeholder}</Text>
          </View>
        )}
      </View>
      {!!error && <Text aria-hidden style={styles.errorText}>{error}</Text>}
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
  titleRef: Ref<Text>;
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
      <View style={styles.sheetOverlay} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.sheetScrim, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessible={false} />
        </Animated.View>
        <Animated.View accessibilityViewIsModal aria-modal role={Platform.OS === 'web' ? 'dialog' : undefined}
          accessibilityLabel={title} onAccessibilityEscape={onClose}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          style={[styles.sheetPanel, title === 'Profile photo' && styles.photoSheetPanel, { transform: [{ translateY }] }]}>
          <View aria-hidden style={styles.sheetHandle} />
          {/* The sheet's first reading stop, so screen readers announce what opened. */}
          <Text ref={titleRef} accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={styles.sheetBody} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SheetRow({ label, onPress, icon, selected }: { label: string; onPress: () => void; icon?: React.ReactNode; selected?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityLabel={label} accessibilityState={selected === undefined ? undefined : { checked: selected }} style={styles.sheetRow}>
      {icon && <View aria-hidden style={styles.sheetRowIcon}>{icon}</View>}
      <Text style={styles.sheetRowText}>{label}</Text>
    </Pressable>
  );
}

export default function CreateAccountForm() {
  const [fontsLoaded, fontError] = useFonts({
    [FONT_REGULAR]: AtkinsonHyperlegible_400Regular,
    [FONT_BOLD]: AtkinsonHyperlegible_700Bold,
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
  const titleRef = useRef<Text>(null);
  const progressRef = useRef<View>(null);
  const completionRef = useRef<Text>(null);
  const photoButtonRef = useRef<View>(null);
  const genderButtonRef = useRef<View>(null);
  const photoSheetTitleRef = useRef<Text>(null);
  const genderSheetTitleRef = useRef<Text>(null);
  const fieldRefs = useRef<Partial<Record<AccountField, TextInput | null>>>({});
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
    return <SafeAreaView style={styles.safe}><View style={styles.statePanel}><ActivityIndicator accessibilityLabel="Loading create account screen" color={GOLD} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        aria-hidden={sheet !== null} accessibilityElementsHidden={sheet !== null}
        importantForAccessibility={sheet ? 'no-hide-descendants' : 'auto'}>
        <View style={styles.frame} nativeID="account-screen" testID="account-screen">
          {complete ? (
            <View style={styles.statePanel}>
              <Text ref={completionRef} nativeID="account-complete" accessible accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} style={styles.heading}>Account complete</Text>
              <Text style={styles.stateText}>Your profile has been saved.</Text>
              <Pressable nativeID="account-continue" accessibilityRole="button" accessibilityLabel="Continue" accessibilityHint="Returns to the home screen" style={styles.primaryButton} onPress={closeFlow}><Text style={styles.primaryButtonText}>Continue</Text></Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Pressable nativeID="account-back" onPress={goBack} disabled={busy} accessibilityRole="button" accessibilityLabel="Back" accessibilityHint={step === 1 ? 'Returns to the home screen' : `Returns to step ${step - 1} of 3`} accessibilityState={{ disabled: busy }} style={styles.headerButton} testID="back-button"><View aria-hidden><BackIcon width={24} height={24} /></View></Pressable>
                <View style={styles.headerTitleContainer}><Text ref={titleRef} nativeID="account-title" accessible accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})} style={styles.headerTitle}>Create an account</Text></View>
                <Pressable nativeID="account-close" onPress={closeFlow} disabled={busy} accessibilityRole="button" accessibilityLabel="Close" accessibilityHint="Closes account setup and returns home" accessibilityState={{ disabled: busy }} style={styles.headerButton} testID="close-button"><View aria-hidden><CloseIcon width={24} height={24} /></View></Pressable>
              </View>
              <View style={styles.intro}>
                <AccountProgress step={step} progressRef={progressRef} />
                <View><Text nativeID="account-heading" accessible accessibilityRole="header" style={[styles.heading, styles.formHeading]}>Your info</Text></View>
              </View>
              <SlidingPages activeIndex={step - 1} reduceMotion={reduceMotion}>
                {STEPS.map(page => (
                  <ScrollView key={page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {page === 1 && (
                      <>
                        <Pressable ref={photoButtonRef} nativeID="account-photo" style={styles.photoButton} onPress={() => openSheet('photo')} disabled={busy || page !== step} accessibilityRole="button" accessibilityLabel={photoUri ? 'Change photo' : 'Add photo'} accessibilityHint="Opens options to take a photo or choose one from your library" accessibilityState={{ disabled: busy }} testID="profile-photo-button">
                          <View aria-hidden>{photoUri ? <Image source={{ uri: photoUri }} style={styles.photoImage} /> : <AddPhotoIcon width={40} height={40} />}</View>
                          <View aria-hidden style={styles.cameraBadge}><CameraIcon width={18} height={18} /></View>
                          
                        </Pressable>
                        <Field label="First name" inputRef={node => { fieldRefs.current.firstName = node; }} active={page === step && !busy} onSubmitEditing={() => fieldRefs.current.lastName?.focus()} testID="first-name" value={form.firstName} onChangeText={value => update('firstName', value)} error={errors.firstName} placeholder="First name" />
                        <Field label="Last name" inputRef={node => { fieldRefs.current.lastName = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="last-name" value={form.lastName} onChangeText={value => update('lastName', value)} error={errors.lastName} placeholder="Last name" />
                      </>
                    )}

                    {page === 2 && (
                      <>
                        <View style={styles.fieldGroup}>
                          <Text aria-hidden style={styles.label}>Gender</Text>
                          <Pressable ref={genderButtonRef} nativeID="account-gender" accessibilityRole="button" accessibilityLabel={errors.gender ? `Gender. ${errors.gender}` : 'Gender'} accessibilityHint="Opens the list of gender options" accessibilityState={{ expanded: sheet === 'gender', disabled: busy }} disabled={busy || page !== step} accessibilityValue={{ text: form.gender || 'Not selected' }} style={[styles.input, styles.select, !!errors.gender && styles.errorInput]} onPress={() => openSheet('gender')} testID="gender-select">
                            <Text style={[styles.selectText, !form.gender && styles.placeholderText]}>{form.gender || 'Select'}</Text>
                            <View aria-hidden><ChevronIcon width={24} height={24} /></View>
                          </Pressable>
                          {!!errors.gender && <Text aria-hidden style={styles.errorText}>{errors.gender}</Text>}
                          
                        </View>
                        <Field label="Birthday" inputRef={node => { fieldRefs.current.birthday = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="birthday" value={form.birthday} onChangeText={value => update('birthday', formatBirthday(value))} error={errors.birthday} placeholder="MM/DD/YY" hint="Enter month, day, and two-digit year." keyboardType="number-pad" />
                      </>
                    )}

                    {page === 3 && (
                      <>
                        <Field label="Email" inputRef={node => { fieldRefs.current.email = node; }} active={page === step} testID="email" value={form.email} onChangeText={value => update('email', value)} error={errors.email} editable={false} />
                        <Field label="Phone number" inputRef={node => { fieldRefs.current.phoneNumber = node; }} active={page === step && !busy} onSubmitEditing={() => fieldRefs.current.usaHockeyNumber?.focus()} testID="phone-number" value={form.phoneNumber} onChangeText={value => update('phoneNumber', formatPhone(value))} error={errors.phoneNumber} placeholder="(###) ###-####" hint="10-digit phone number." keyboardType="phone-pad" />
                        <Field label="USA hockey number (Optional)" inputRef={node => { fieldRefs.current.usaHockeyNumber = node; }} active={page === step && !busy} onSubmitEditing={advance} testID="hockey-number" value={form.usaHockeyNumber} onChangeText={value => update('usaHockeyNumber', value)} placeholder="#########" hint="Numbers only." keyboardType="number-pad" />
                        <Pressable nativeID="account-location" style={styles.locationBlock} accessibilityRole="switch" accessibilityLabel="Allow location access" accessibilityHint="We’ll use your location to show you teams and events near you."
                          accessibilityState={{ checked: form.allowLocation, disabled: busy || locationPending, busy: locationPending }}
                          disabled={busy || locationPending || page !== step} onPress={() => toggleLocation(!form.allowLocation)} testID="location-toggle">
                          <View style={styles.locationHeader}>
                            <Text aria-hidden style={styles.label}>Allow location access</Text>
                            <View pointerEvents="none" aria-hidden style={styles.locationSwitch}><Switch accessible={false} value={form.allowLocation} trackColor={{ false: '#6B6B6B', true: GOLD }} thumbColor={form.allowLocation ? '#010101' : '#FFFFFF'} /></View>
                          </View>
                          <Text aria-hidden style={styles.locationHelper}>We’ll use your location to show you teams and events near you.</Text>
                          
                        </Pressable>
                      </>
                    )}
                    {page === step && (
                      <View nativeID="account-feedback" testID="account-feedback" accessible={!!message}
                        accessibilityLiveRegion={Platform.OS === 'web' ? 'polite' : 'none'}>
                        {!!message && <Text key={feedbackSequence} style={styles.notice}>{message}</Text>}
                      </View>
                    )}
                    <Pressable nativeID={`account-next-${page}`} accessibilityRole="button" accessibilityLabel={busy ? 'Saving account' : page === 3 ? 'Complete account' : 'Next'} accessibilityState={{ disabled: busy || locationPending, busy }} disabled={busy || locationPending || page !== step} style={[styles.primaryButton, busy && styles.buttonBusy]} onPress={advance} testID="next-button">
                      <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : page === 3 ? 'Complete account' : 'Next'}</Text>
                      
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
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" style={styles.sheetCancel} onPress={closeSheet}><Text style={styles.primaryButtonText}>Cancel</Text></Pressable>
      </Sheet>
      <Sheet title="Gender" visible={sheet === 'gender'} reduceMotion={reduceMotion} onClose={closeSheet} onShow={() => requestFocus(genderSheetTitleRef)} onDismiss={restoreSheetFocus} titleRef={genderSheetTitleRef}>
        {GENDERS.map(gender => <SheetRow key={gender} label={gender} selected={form.gender === gender}
          onPress={() => { update('gender', gender); closeSheet(); }} />)}
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" style={styles.sheetCancel} onPress={closeSheet}><Text style={styles.primaryButtonText}>Cancel</Text></Pressable>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#010101' },
  fill: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: 412, alignSelf: 'center', backgroundColor: '#010101' },
  header: { minHeight: 60, borderBottomWidth: 1, borderBottomColor: '#5C5C5C', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  headerButton: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 30, fontFamily: FONT_BOLD, textAlign: 'center' },
  intro: { paddingHorizontal: 16, paddingTop: 16 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48 },
  progress: { flexDirection: 'row', gap: 6, height: 6, marginBottom: 20 },
  progressSegment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#6B6B6B' },
  heading: { color: '#FFFFFF', fontSize: 26, lineHeight: 34, fontFamily: FONT_BOLD, textAlign: 'center', marginBottom: 28 },
  formHeading: { marginBottom: 24 },
  photoButton: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderStyle: 'dashed', borderColor: '#8C8C8C', backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center', marginTop: -4, marginBottom: 28 },
  photoImage: { width: 84, height: 84, borderRadius: 42 },
  cameraBadge: { position: 'absolute', bottom: -3, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { minHeight: 90, marginBottom: 20 },
  label: { color: '#FFFFFF', fontSize: 18, lineHeight: 26, fontFamily: FONT_BOLD, marginBottom: 8 },
  input: { minHeight: 56, width: '100%', borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#2D2E2F', color: '#FFFFFF', fontSize: 18, fontFamily: FONT_REGULAR, paddingHorizontal: 18, paddingVertical: 10 },
  readOnlyInput: { backgroundColor: '#262626', borderColor: '#5C5C5C', borderWidth: 1 },
  errorInput: { borderColor: '#FF8A80' },
  errorText: { color: '#FF8A80', fontSize: 13, fontFamily: FONT_REGULAR, marginTop: 4 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: '#FFFFFF', fontSize: 18, fontFamily: FONT_REGULAR },
  placeholderText: { color: '#BDBDBD' },
  // Matches the input's 2px border + 18px padding so the text sits where a native placeholder would.
  placeholderOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', paddingHorizontal: 20 },
  locationBlock: { minHeight: 132, marginBottom: 20, paddingHorizontal: 17, paddingVertical: 8 },
  locationHeader: { minHeight: 44, position: 'relative', paddingRight: 64 },
  locationSwitch: { position: 'absolute', top: 0, right: 0 },
  locationHelper: { color: '#BDBDBD', fontSize: 18, lineHeight: 24, fontFamily: FONT_REGULAR, marginTop: 16, maxWidth: 348 },
  notice: { color: '#FF8A80', fontSize: 14, lineHeight: 20, fontFamily: FONT_REGULAR, marginBottom: 16 },
  primaryButton: { minHeight: 56, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 4, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonBusy: { opacity: 0.65 },
  primaryButtonText: { color: '#010101', fontSize: 20, lineHeight: 28, fontFamily: FONT_BOLD },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetPanel: { maxHeight: '85%', backgroundColor: '#1F1F1F', borderTopColor: '#5C5C5C', borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 39 },
  sheetBody: { flexGrow: 0, flexShrink: 1 },
  photoSheetPanel: { minHeight: 304 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#8C8C8C', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: '#D9D9D9', fontSize: 18, lineHeight: 22, fontFamily: FONT_BOLD, textAlign: 'center', marginBottom: 11 },
  sheetRow: { minHeight: 64, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomColor: '#5C5C5C', borderBottomWidth: 1 },
  sheetRowIcon: { width: 44, alignItems: 'flex-start' },
  sheetRowText: { color: '#FFFFFF', fontSize: 18, fontFamily: FONT_REGULAR, flexShrink: 1 },
  sheetCancel: { minHeight: 56, paddingVertical: 12, borderRadius: 4, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  statePanel: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  stateText: { color: '#D9D9D9', textAlign: 'center', fontSize: 16, lineHeight: 24, fontFamily: FONT_REGULAR, marginBottom: 24 },
});
