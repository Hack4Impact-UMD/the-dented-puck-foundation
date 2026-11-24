import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { HomeEvent, HomeEventTeam, HomeViewer } from '@/types/home';
import { teamAcronym, teamRelationship } from '@/utils/homeEvents';

export function eventTimeLabel(event: HomeEvent): string {
  const time = (date: Date) => date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const crossesDate = event.startTime.toDateString() !== event.endTime.toDateString();
  const endDate = crossesDate ? `${event.endTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}, ` : '';
  return `${time(event.startTime)} to ${endDate}${time(event.endTime)}`;
}

export function EventCard({ event, viewer, onPress }: { event: HomeEvent; viewer?: HomeViewer | null; onPress?: () => void }) {
  const { fontScale, width } = useWindowDimensions();
  const date = event.startTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = eventTimeLabel(event);
  const teams = event.teams ?? [];
  const stacked = fontScale > 1.3 || width < 360 || teams.length > 1 || teams.some((team) => Array.from(teamAcronym(team)).length > 4);
  const teamLabel = teams.map((team) => [team.name, teamRelationship(team.id, viewer)].filter(Boolean).join(', ')).join(', ');

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={[event.title, date, time, event.location, teamLabel].filter(Boolean).join(', ')}
      accessibilityHint={onPress ? 'Opens the event' : 'Event details are not available yet'}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-28 flex-row items-center gap-[15px] rounded bg-surface-card p-2.5 active:opacity-70"
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={`min-h-[92px] min-w-14 shrink-0 items-center justify-center rounded bg-black px-2 py-1.5 ${stacked ? 'self-start' : ''}`}>
        <Text className="font-sans-bold text-lg text-brand">{event.startTime.toLocaleDateString(undefined, { month: 'short' })}</Text>
        <Text className="font-sans-bold text-[32px] leading-10 text-brand">{event.startTime.getDate()}</Text>
      </View>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="min-w-0 flex-1 gap-1">
        <Text className="font-sans-bold text-[22px] leading-7 text-white">{event.title}</Text>
        <Text className="font-sans text-lg leading-7 text-white">{time}</Text>
        <Text className="font-sans text-lg leading-6 text-ink-subtle">{event.location}</Text>
        {stacked && <View className="mt-1 flex-row flex-wrap items-start gap-2">{teams.map((team) => <TeamBadge key={team.id} team={team} viewer={viewer} compact />)}</View>}
      </View>
      {!stacked && !!teams.length && <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="max-w-[30%] self-stretch items-end gap-2 py-1.5">{teams.map((team) => <TeamBadge key={team.id} team={team} viewer={viewer} />)}</View>}
    </Pressable>
  );
}

function TeamBadge({ team, viewer, compact = false }: { team: HomeEventTeam; viewer?: HomeViewer | null; compact?: boolean }) {
  const relationship = teamRelationship(team.id, viewer);
  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={compact ? 'min-w-0 max-w-full items-start gap-1' : 'min-h-[78px] max-w-full items-end justify-between gap-3'}>
      <View className="max-w-full rounded border border-brand bg-brand-soft-dark px-3 py-1">
        <Text className="shrink text-right font-sans-bold text-lg text-brand">{teamAcronym(team)}</Text>
      </View>
      {relationship && <Text className="font-sans text-lg text-ink-subtle">{relationship}</Text>}
    </View>
  );
}
