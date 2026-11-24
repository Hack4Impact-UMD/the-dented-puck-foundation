import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import TeamIcon from '@/components/team/TeamIcon';
import { FollowTeamButton } from './FollowTeamButton';

type Props = {
  teamId: string;
  name: string;
  ageRange?: string;
  city: string;
  followed: boolean;
  pending: boolean;
  followError: boolean;
  onToggleFollow: () => void;
  className?: string;
};

// One tile of the 6600 grid. Reading order: the card (one stop), then its Follow button.
export function TeamGridCard({ teamId, name, ageRange, city, followed, pending, followError, onToggleFollow, className = '' }: Props) {
  // Annotation 2: "Team name, ages, city". Ages only show when the team has an ageRange.
  const label = [name, ageRange, city].filter(Boolean).join(', ');

  return (
    <View className={`gap-4 rounded bg-surface-field p-4 ${className}`}>
      <Pressable
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => router.push({ pathname: '/tabs/teams/[teamId]', params: { teamId } })}
        className="items-center gap-3 active:opacity-70"
      >
        <TeamIcon name={name} size={56} />
        {/* Same shape for every card: the name gets exactly two lines (longer names end in "…";
            the card's label and Team detail still have the full name) and the ages line keeps its
            space when empty, so ages, city and Follow line up across the whole grid. */}
        <View className="w-full items-center gap-1">
          <View className="min-h-14 w-full justify-center">
            <Text numberOfLines={2} className="text-center font-sans-bold text-xl text-white">
              {name}
            </Text>
          </View>
          <Text className="text-center font-sans text-base text-white">{ageRange ?? ' '}</Text>
          <Text className="text-center font-sans text-base text-ink-subtle">{city || ' '}</Text>
        </View>
      </Pressable>

      {/* mt-auto keeps Follow at the bottom of the card, so buttons line up across a row (e.g. at large text sizes). */}
      <View className="mt-auto gap-2">
        <FollowTeamButton teamName={name} followed={followed} pending={pending} onPress={onToggleFollow} />

        {followError && (
          <Text accessibilityRole="alert" className="text-center font-sans text-base text-danger-dark">
            {`Couldn't update ${name}. Try again.`}
          </Text>
        )}
      </View>
    </View>
  );
}
