import { type ComponentRef, type RefObject, useRef, useState } from 'react';
import { AccessibilityInfo, FlatList, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { EventCard } from '@/components/home/EventCard';
import { homeDestinations } from '@/config/homeDestinations';
import type { UpcomingEvent } from '@/services/eventService';
import type { HomeViewer } from '@/types/home';
import { filterByTeams, filterValue, SORT_LABELS, sortEvents, teamsInEvents, type EventSort } from './eventList';
import { ListControlButton } from './ListControlButton';
import { OptionSheet } from './OptionSheet';

type Props = { events: UpcomingEvent[]; viewerRegionId: number | null; homeViewer?: HomeViewer | null };

// 6300 – See All (Events). Reading order: Filter, Sort, then each event card.
// Cards are Home's EventCard, so both screens show events the same way.
// Filter only offers teams that are in the list, so a filtered list is never empty.
export function UpcomingEventsList({ events, viewerRegionId, homeViewer }: Props) {
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [sort, setSort] = useState<EventSort>('date');
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const filterRef = useRef<ComponentRef<typeof View>>(null);
  const sortRef = useRef<ComponentRef<typeof View>>(null);

  // When a sheet closes, put the screen reader back on the button that opened it.
  // sendAccessibilityEvent only exists on iOS and Android.
  const refocus = (ref: RefObject<ComponentRef<typeof View> | null>) => {
    if (Platform.OS !== 'web' && ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
  };

  const teams = teamsInEvents(events);
  const shown = sortEvents(filterByTeams(events, teamIds), sort, viewerRegionId);

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row gap-3 px-4 pb-2 pt-4">
        <ListControlButton
          ref={filterRef}
          label="Filter"
          value={filterValue(teamIds.length)}
          count={teamIds.length}
          icon="filter"
          onPress={() => setSheet('filter')}
        />
        <ListControlButton
          ref={sortRef}
          label="Sort"
          value={SORT_LABELS[sort]}
          icon="swap-vertical"
          onPress={() => setSheet('sort')}
        />
      </View>

      <FlatList
        data={shown}
        keyExtractor={(event) => event.id}
        renderItem={({ item }) => {
          const href = homeDestinations.event?.(item.id);
          return <EventCard event={item} viewer={homeViewer} onPress={href ? () => router.push(href) : undefined} />;
        }}
        contentContainerClassName="gap-4 p-4"
      />

      <OptionSheet
        visible={sheet === 'filter'}
        title="Filter by team"
        options={teams.map((team) => ({ value: team.id, label: team.name }))}
        selected={teamIds}
        multiple
        onChange={setTeamIds}
        onClose={() => setSheet(null)}
        onDismiss={() => refocus(filterRef)}
      />
      <OptionSheet
        visible={sheet === 'sort'}
        title="Sort"
        options={(Object.keys(SORT_LABELS) as EventSort[]).map((value) => ({ value, label: SORT_LABELS[value] }))}
        selected={[sort]}
        multiple={false}
        onChange={([value]) => setSort(value as EventSort)}
        onClose={() => setSheet(null)}
        onDismiss={() => refocus(sortRef)}
      />
    </View>
  );
}
