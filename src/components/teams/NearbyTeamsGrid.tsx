import { ScrollView, View, useWindowDimensions } from 'react-native';
import { regions, type RegionTeam } from '@/services/teamService';
import { TeamGridCard } from './TeamGridCard';

type Props = {
  teams: RegionTeam[];
  followedTeamIds: string[];
  pendingTeamId?: string;
  failedTeamId?: string;
  onToggleFollow: (teamId: string, followed: boolean) => void;
};

// 6600 – See All (Teams). Two columns; tiles are in JSX order, so a reader goes
// card, its Follow, next card, its Follow, matching the gold pins row by row.
export function NearbyTeamsGrid({ teams, followedTeamIds, pendingTeamId, failedTeamId, onToggleFollow }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 360 || fontScale > 1.3;

  return (
    <ScrollView className="flex-1 bg-black" contentContainerClassName="flex-row flex-wrap justify-between gap-y-4 p-4">
      {teams.map((team) => {
        const followed = followedTeamIds.includes(team.id);
        return (
          <TeamGridCard
            key={team.id}
            teamId={team.id}
            name={team.name}
            ageRange={team.ageRange}
            city={regions.find((region) => region.regionId === team.regionId)?.city ?? ''}
            followed={followed}
            pending={pendingTeamId === team.id}
            followError={failedTeamId === team.id}
            onToggleFollow={() => onToggleFollow(team.id, !followed)}
            className={singleColumn ? 'w-full' : 'w-[48%]'}
          />
        );
      })}
      {/* Keeps a lone last tile at half width instead of stretching. */}
      {!singleColumn && teams.length % 2 === 1 && <View className="w-[48%]" />}
    </ScrollView>
  );
}
