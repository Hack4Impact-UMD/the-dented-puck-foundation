import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { EventCard } from '@/components/home/EventCard';
import { HomeMessage } from '@/components/home/HomeMessage';
import { HomeSeeAll } from '@/components/home/HomeSeeAll';
import { HomeTransition } from '@/components/home/HomeTransition';
import { useHomeDashboard, type HomeResult } from '@/hooks/useHomeDashboard';
import { DISCOVER_PREVIEW_SIZE, HOME_PREVIEW_SIZE, HOME_TITLES, type HomeEvent, type HomePage, type HomeSection as Section } from '@/types/home';

export function HomeSection({ section, result }: { section: Section; result: HomeResult<HomeEvent> }) {
  const { state, source, destinations, refresh, isCurrentViewer } = useHomeDashboard();
  const previewSize = section === 'upcoming' ? DISCOVER_PREVIEW_SIZE : HOME_PREVIEW_SIZE;
  const [scan, setScan] = useState<{
    base: typeof result.page; viewer: typeof state.viewer; source: typeof source; since: Date; section: Section;
    page: HomePage<HomeEvent>; pending: boolean; error: string | null;
  } | null>(null);
  const currentScan = scan && scan.base === result.page && scan.viewer === state.viewer &&
    scan.source === source && scan.since === state.since && scan.section === section && !state.refreshing ? scan : null;
  if (scan && !currentScan) setScan(null);
  const page = currentScan?.page ?? result.page;
  const canContinue = page?.scanIncomplete && page.items.length < previewSize;
  const continueScan = async () => {
    if (!page || !state.viewer || currentScan?.pending || state.refreshing) return;
    const pendingScan = { base: result.page, viewer: state.viewer, source, since: state.since, section, page, pending: true, error: null };
    setScan(pendingScan);
    try {
      const next = await source.events(state.viewer, section, state.since, previewSize - page.items.length, page.cursor);
      if (!isCurrentViewer(state.viewer.uid)) return;
      setScan((previous) => previous === pendingScan ? {
        ...pendingScan, pending: false, page: { ...next, items: [...page.items, ...next.items] },
      } : previous);
    } catch {
      setScan((previous) => previous === pendingScan ? { ...pendingScan, pending: false, error: 'Please try again.' } : previous);
    }
  };
  return (
    <HomeTransition className="gap-6">
      <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Text accessibilityRole="header" className="shrink font-sans-bold text-[26px] leading-[34px] text-white">{HOME_TITLES[section]}</Text>
        {!canContinue && (page?.hasMore || (page?.items.length ?? 0) > previewSize) && (
          <HomeSeeAll label={`See all ${section === 'schedule' ? 'schedule' : 'upcoming events'}`}
            href={destinations.eventList?.(section)} />
        )}
      </View>
      {result.loading ? <HomeTransition key="loading" presence><HomeMessage announce={false} loading title={`Loading ${HOME_TITLES[section].toLowerCase()}`} /></HomeTransition>
        : result.error ? <HomeTransition key="error" presence><HomeMessage title="Unable to load events" message={result.error} action="Try again" onAction={refresh} /></HomeTransition>
        : !page?.items.length && !canContinue ? <HomeTransition key="empty" presence><HomeMessage announce={false}
          title={section === 'schedule' ? 'No upcoming team events' : 'No upcoming regional events'}
          message={section === 'upcoming' ? 'Events from teams you join or follow appear in For You. Check back for more regional events.'
            : !state.viewer?.teamIds.length && !state.viewer?.followedTeamIds.length ? 'Your schedule will appear here when you join or follow a team.' : 'Check back for new events.'}
        /></HomeTransition>
        : page?.items.slice(0, previewSize).map((event) => (
          <HomeTransition key={`${section}:${event.id}`} presence>
            <EventCard event={event} viewer={state.viewer} onPress={destinations.event ? () => router.push(destinations.event!(event.id)) : undefined} />
          </HomeTransition>
        ))}
      {!result.loading && !result.error && canContinue && <HomeMessage
        title={currentScan?.pending ? 'Looking for more events' : currentScan?.error ? 'Unable to continue looking' : 'Keep looking for events'}
        message={currentScan?.error ?? (currentScan?.pending ? undefined : 'There are more events to check for your dashboard.')}
        loading={currentScan?.pending}
        action={!currentScan?.pending && !state.refreshing ? 'Find more events' : undefined}
        onAction={continueScan}
      />}
    </HomeTransition>
  );
}
