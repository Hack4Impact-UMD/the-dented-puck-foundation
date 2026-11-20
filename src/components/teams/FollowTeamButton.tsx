import { Platform, Pressable, Text } from 'react-native';

type Props = {
  teamName: string;
  followed: boolean;
  pending: boolean;
  onPress: () => void;
};

// Annotation 3: the label stays "Follow {team}"; following is a state, not a new label.
// iOS has no toggle role, so it's a button that is selected while following.
// Android is a toggle button, checked while following. React Native has no prop for
// Android's stateDescription, so accessibilityValue text adds "Following" to what TalkBack reads.
export function FollowTeamButton({ teamName, followed, pending, onPress }: Props) {
  const android = Platform.OS === 'android';
  const state = android
    ? { checked: followed, disabled: pending, busy: pending }
    : { selected: followed, disabled: pending, busy: pending };

  // Same styles as AppButton's secondary (Follow) and outline (Followed). AppButton can't take a state or value.
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole={android ? 'togglebutton' : 'button'}
      accessibilityLabel={`Follow ${teamName}`}
      accessibilityState={state}
      accessibilityValue={android && followed ? { text: 'Following' } : undefined}
      className={`min-h-14 items-center justify-center rounded-[4px] px-2 active:opacity-70 ${
        followed ? 'border-2 border-brand bg-brand-soft-dark' : 'bg-brand'
      } ${pending ? 'opacity-60' : ''}`}
    >
      <Text className={`text-center font-sans-bold text-[20px] ${followed ? 'text-brand' : 'text-on-brand'}`}>
        {followed ? 'Followed' : 'Follow'}
      </Text>
    </Pressable>
  );
}
