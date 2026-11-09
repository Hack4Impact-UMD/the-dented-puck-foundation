import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export type RsvpResponse = 'going' | 'maybe' | 'cant-go';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const HEADING = 'Are you going?';
const EDIT_LABEL = 'Edit your reply';
const BRAND = '#FFD101';
const WHITE = '#FFFFFF';

// The answered bar (Figma 6410/6420/6430) is one style for every reply; only the icon differs.
const OPTIONS: {
  value: RsvpResponse;
  label: string;
  icon: IconName;
  answeredIcon: IconName;
}[] = [
  { value: 'going', label: 'Going', icon: 'checkmark-circle-outline', answeredIcon: 'checkmark-circle' },
  { value: 'maybe', label: 'Maybe', icon: 'help-circle-outline', answeredIcon: 'help-circle' },
  { value: 'cant-go', label: "Can't go", icon: 'close-circle-outline', answeredIcon: 'close-circle' },
];

// iOS has no radio role, so each option is a button there. Android gets a radio group.
const GROUP_ROLE = Platform.select<'radiogroup' | undefined>({ android: 'radiogroup', default: undefined });
const OPTION_ROLE = Platform.select<'radio' | 'button'>({ android: 'radio', default: 'button' });
const optionState = (chosen: boolean) =>
  Platform.select({ android: { checked: chosen }, default: { selected: chosen } });

type Props = {
  value: RsvpResponse | null;
  onChange: (value: RsvpResponse) => void;
};

// Reading order: heading, then the three options (or the answered bar with its pencil).
// The pencil (6440) brings the options back with the current reply selected; picking one saves it.
export function RsvpSection({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
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
    <View className="gap-4">
      <Text
        ref={headingRef}
        accessibilityLabel={HEADING}
        accessibilityRole="header"
        className="font-sans-bold text-xl text-white"
      >
        {HEADING}
      </Text>

      {showOptions || !answer ? (
        <View accessibilityRole={GROUP_ROLE} accessibilityLabel={HEADING} className="flex-row gap-3">
          {OPTIONS.map((option) => {
            const chosen = editing && option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => choose(option.value)}
                accessibilityRole={OPTION_ROLE}
                accessibilityState={optionState(chosen)}
                accessibilityLabel={option.label}
                className={`min-h-[88px] flex-1 items-center justify-center gap-2 rounded border bg-surface-field px-1 active:opacity-70 ${chosen ? 'border-brand' : 'border-line'}`}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={WHITE}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text className="text-center font-sans-bold text-xl text-white">{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        // A plain View, not a Pressable: only the pencil does anything once a reply is saved.
        <View className="min-h-14 flex-row items-center gap-3 rounded border border-brand bg-brand-soft-dark px-4">
          <Ionicons
            name={answer.answeredIcon}
            size={24}
            color={BRAND}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            ref={replyRef}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Your reply: ${answer.label}`}
            className="flex-1 font-sans-bold text-xl text-white"
          >
            {answer.label}
          </Text>
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel={EDIT_LABEL}
            className="h-12 w-12 items-center justify-center active:opacity-70"
          >
            <Ionicons
              name="pencil"
              size={22}
              color={WHITE}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}
