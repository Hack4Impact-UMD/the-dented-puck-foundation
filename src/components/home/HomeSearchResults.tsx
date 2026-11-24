import { useMemo, type ReactNode } from 'react';
import { FlatList, Text, View, type ScrollViewProps } from 'react-native';
import { router } from 'expo-router';
import { EventCard } from '@/components/home/EventCard';
import { HomeMessage } from '@/components/home/HomeMessage';
import { HomeStatusText } from '@/components/home/HomeStatusText';
import { HomeTransition } from '@/components/home/HomeTransition';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useHomeSearch } from '@/hooks/useHomeSearch';
import { searchHomeEvents, type HomeSearchScope } from '@/utils/homeSearch';

export function HomeSearchResults({ query, scope, header, enabled = true, refreshControl }: {
  query: string; scope: HomeSearchScope; header: ReactNode; enabled?: boolean; refreshControl?: ScrollViewProps['refreshControl'];
}) {
  const { state, destinations } = useHomeDashboard();
  const search = useHomeSearch(enabled);
  const events = useMemo(() => enabled && search.catalog && state.viewer
    ? searchHomeEvents(search.catalog, query, scope, state.viewer) : [], [enabled, search.catalog, query, scope, state.viewer]);
  const ready = search.available && !search.loading && !search.error && !!search.catalog;
  const title = scope === 'schedule' ? 'My schedule' : scope === 'nearby' ? 'Nearby events' : 'All events';

  return <FlatList
    style={{ flex: 1 }}
    data={events}
    extraData={state.viewer}
    keyExtractor={(event) => event.id}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    automaticallyAdjustKeyboardInsets
    refreshControl={refreshControl}
    removeClippedSubviews={false}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, width: '100%', maxWidth: 680, alignSelf: 'center' }}
    // An element keeps the header's field mounted while typing, clearing,
    // changing scope, or loading a new location. Never use an inline component.
    ListHeaderComponent={<View>
      {header}
      {enabled && ready && <HomeTransition presence fromBottom className="gap-1 px-4 pb-4">
        <Text accessibilityRole="header" className="font-sans-bold text-[26px] leading-[34px] text-white">{title}</Text>
        <HomeStatusText delay={600} accessibilityLabel={`${title}, ${events.length} event${events.length === 1 ? '' : 's'}${query.trim() ? ` found for ${query.trim()}` : ''}. Soonest first.`}
          className="font-sans text-lg leading-6 text-ink-subtle">
          {`${events.length} event${events.length === 1 ? '' : 's'}${query.trim() ? ' found' : ''} · Soonest first`}
        </HomeStatusText>
      </HomeTransition>}
    </View>}
    renderItem={({ item }) => <HomeTransition presence fromBottom className="px-4"><EventCard event={item} viewer={state.viewer}
      onPress={destinations.event ? () => router.push(destinations.event!(item.id)) : undefined} /></HomeTransition>}
    ItemSeparatorComponent={EventSeparator}
    ListEmptyComponent={!enabled ? undefined : <View className="px-4">{!search.available
      ? <HomeMessage title="Search is not available yet" message="Search for this account is still being connected." />
      : search.loading ? <HomeMessage title="Loading events" loading />
      : search.error ? <HomeMessage title="Unable to load search" message={search.error} action="Try again" onAction={search.reload} />
      : ready ? <HomeMessage title={query.trim() ? 'No matches found' : scope === 'schedule' ? 'No events in your schedule' : 'No events in this area'}
        message={query.trim() ? 'Try another event, team, venue, or city, or change the filter.' : scope === 'schedule' ? 'Events from your joined and followed teams will appear here.' : 'Choose another location to see nearby events.'} /> : undefined}</View>}
  />;
}

function EventSeparator() {
  return <View style={{ height: 16 }} />;
}
