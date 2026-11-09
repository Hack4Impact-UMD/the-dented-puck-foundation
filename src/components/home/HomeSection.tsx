import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { EventCard } from '@/components/home/EventCard';
import { HomeMessage } from '@/components/home/HomeMessage';
import { HomeSeeAll } from '@/components/home/HomeSeeAll';
import { HomeTransition } from '@/components/home/HomeTransition';
import { useHomeDashboard, type HomeResult } from '@/hooks/useHomeDashboard';
import { DISCOVER_PREVIEW_SIZE, HOME_PREVIEW_SIZE, HOME_TITLES, type HomeEvent, type HomeSection as Section } from '@/types/home';

export function HomeSection({ section, result }: { section: Section; result: HomeResult<HomeEvent> }) {
  const { state, destinations, refresh } = useHomeDashboard();
  const previewSize = section === 'upcoming' ? DISCOVER_PREVIEW_SIZE : HOME_PREVIEW_SIZE;
  return (
    <HomeTransition className="gap-6">
      <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Text accessibilityRole="header" className="shrink font-sans-bold text-[26px] leading-[34px] text-white">{HOME_TITLES[section]}</Text>
        {(result.page?.hasMore || (result.page?.items.length ?? 0) > previewSize) && (
          <HomeSeeAll label={`See all ${section === 'schedule' ? 'schedule' : 'upcoming events'}`}
            href={destinations.eventList?.(section)} />
        )}
      </View>
      {result.loading ? <HomeTransition key="loading" presence><HomeMessage loading title={`Loading ${HOME_TITLES[section].toLowerCase()}`} /></HomeTransition>
        : result.error ? <HomeTransition key="error" presence><HomeMessage title="Unable to load events" message={result.error} action="Try again" onAction={refresh} /></HomeTransition>
        : !result.page?.items.length ? <HomeTransition key="empty" presence><HomeMessage
          title={section === 'schedule' ? 'No upcoming team events' : 'No upcoming regional events'}
          message={section === 'upcoming' ? 'Events from teams you join or follow appear in For You. Check back for more regional events.'
            : !state.viewer?.teamIds.length && !state.viewer?.followedTeamIds.length ? 'Your schedule will appear here when you join or follow a team.' : 'Check back for new events.'}
        /></HomeTransition>
        : result.page.items.slice(0, previewSize).map((event) => (
          <HomeTransition key={`${section}:${event.id}`} presence>
            <EventCard event={event} viewer={state.viewer} onPress={destinations.event ? () => router.push(destinations.event!(event.id)) : undefined} />
          </HomeTransition>
        ))}
    </HomeTransition>
  );
}
