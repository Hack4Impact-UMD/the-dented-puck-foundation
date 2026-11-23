import { type ComponentRef, type ComponentType, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import CancelFilledIcon from '@/assets/icons/cancel-filled.svg';
import CheckCircleFilledIcon from '@/assets/icons/check-circle-filled.svg';
import CheckCircleOutlineIcon from '@/assets/icons/check-circle-outline.svg';
import EditIcon from '@/assets/icons/edit.svg';
import HelpFilledIcon from '@/assets/icons/help-filled.svg';
import HelpOutlineIcon from '@/assets/icons/help-outline.svg';
import HighlightOffIcon from '@/assets/icons/highlight-off.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

export type RsvpResponse = 'going' | 'maybe' | 'cant-go';
type Icon = ComponentType<SvgProps>;

const HEADING = 'Are you going?';
const EDIT_LABEL = 'Edit your reply';

// Icons are the Figma (USWDS) exports: outlined on the options, filled gold on the answered bar.
// The answered bar (Figma 6410/6420/6430) is one style for every reply; only the icon differs.
const OPTIONS: {
  value: RsvpResponse;
  part: 'going' | 'maybe' | 'cantGo';
  label: string;
  Icon: Icon;
  AnsweredIcon: Icon;
}[] = [
  { value: 'going', part: 'going', label: 'Going', Icon: CheckCircleOutlineIcon, AnsweredIcon: CheckCircleFilledIcon },
  { value: 'maybe', part: 'maybe', label: 'Maybe', Icon: HelpOutlineIcon, AnsweredIcon: HelpFilledIcon },
  { value: 'cant-go', part: 'cantGo', label: "Can't go", Icon: HighlightOffIcon, AnsweredIcon: CancelFilledIcon },
];

// iOS has no radio role, so each option is a button there. Android gets a radio group.
const GROUP_ROLE = Platform.select<'radiogroup' | undefined>({ android: 'radiogroup', default: undefined });
const OPTION_ROLE = Platform.select<'radio' | 'button'>({ android: 'radio', default: 'button' });
const optionState = (chosen: boolean) =>
  Platform.select({ android: { checked: chosen }, default: { selected: chosen } });

/** Spoken text for each stop in an `RsvpSection`. */
export type RsvpSectionScreenReaderParts = {
  /** The "Are you going?" heading (also names the option group on Android). */
  heading?: ScreenReaderStopText;
  /** The Going option. Default label: "Going". */
  going?: ScreenReaderControlText;
  /** The Maybe option. Default label: "Maybe". */
  maybe?: ScreenReaderControlText;
  /** The Can't go option. Default label: "Can't go". */
  cantGo?: ScreenReaderControlText;
  /** The answered bar. Default label: "Your reply: {answer}". */
  reply?: ScreenReaderStopText;
  /** The pencil on the answered bar. Default label: "Edit your reply". */
  edit?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  value: RsvpResponse | null;
  onChange: (value: RsvpResponse) => void;
  screenReaderParts?: RsvpSectionScreenReaderParts;
};

// Reading order: heading, then the three options (or the answered bar with its pencil).
// The pencil (6440) brings the options back with the current reply selected; picking one saves it.
export function RsvpSection({ value, onChange, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const [editing, setEditing] = useState(false);
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const heading = screenReaderParts?.heading?.label ?? HEADING;
  const edit = screenReaderParts?.edit;
  const headingRef = useRef<ComponentRef<typeof Text>>(null);
  const replyRef = useRef<ComponentRef<typeof Text>>(null);

  const showOptions = value === null || editing;
  const previousShowOptions = useRef(showOptions);

  // After a reply, focus "Your reply". After the pencil, the bar is gone, so focus the heading.
  useEffect(() => {
    if (previousShowOptions.current === showOptions) return;
    previousShowOptions.current = showOptions;
    // sendAccessibilityEvent only exists on iOS and Android.
    if (Platform.OS === 'web') return;
    const target = showOptions ? headingRef.current : replyRef.current;
    if (target) AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
  }, [showOptions]);

  const answer = OPTIONS.find((option) => option.value === value);

  const choose = (next: RsvpResponse) => {
    onChange(next);
    setEditing(false);
  };

  return (
    <View {...screenReaderProps} className="gap-3">
      <Text
        ref={headingRef}
        accessibilityLabel={heading}
        accessibilityRole="header"
        className="font-sans-bold text-h3 text-white"
      >
        {HEADING}
      </Text>

      {showOptions || !answer ? (
        <View accessibilityRole={GROUP_ROLE} accessibilityLabel={heading} className="flex-row gap-2">
          {OPTIONS.map(({ value: optionValue, part, label, Icon }) => {
            const chosen = editing && optionValue === value;
            const text = screenReaderParts?.[part];
            return (
              <Pressable
                {...skipFocusProps(hideFromScreenReader)}
                key={optionValue}
                onPress={withPressAnnouncement(() => choose(optionValue), text?.pressAnnouncement)}
                accessibilityRole={OPTION_ROLE}
                accessibilityState={optionState(chosen)}
                accessibilityLabel={text?.label ?? label}
                accessibilityHint={text?.hint}
                className={`flex-1 items-center gap-1.5 rounded border bg-surface-card px-2 py-3.5 active:opacity-70 ${chosen ? 'border-brand' : 'border-line'}`}
              >
                <Icon width={24} height={24} />
                <Text className="text-center font-sans-bold text-[21px] leading-7 text-white">{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        // A plain View, not a Pressable: only the pencil does anything once a reply is saved.
        <View className="min-h-[72px] flex-row items-center gap-3 rounded border-2 border-brand bg-brand-soft-dark py-3 pl-4 pr-1">
          <answer.AnsweredIcon width={32} height={32} />
          <Text
            ref={replyRef}
            accessible
            accessibilityRole="text"
            accessibilityLabel={screenReaderParts?.reply?.label ?? `Your reply: ${answer.label}`}
            className="flex-1 font-sans-bold text-h3 text-white"
          >
            {answer.label}
          </Text>
          <Pressable
            {...skipFocusProps(hideFromScreenReader)}
            onPress={withPressAnnouncement(() => setEditing(true), edit?.pressAnnouncement)}
            accessibilityRole="button"
            accessibilityLabel={edit?.label ?? EDIT_LABEL}
            accessibilityHint={edit?.hint}
            className="h-12 w-12 items-center justify-center active:opacity-70"
          >
            <EditIcon width={24} height={24} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
