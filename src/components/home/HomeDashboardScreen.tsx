import { useCallback, useState } from 'react';
import { Animated, BackHandler, Keyboard, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { AnnouncementCard } from '@/components/home/AnnouncementCard';
import { HomeMessage } from '@/components/home/HomeMessage';
import { HomeSection } from '@/components/home/HomeSection';
import { HomeSeeAll } from '@/components/home/HomeSeeAll';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { HOME_PREVIEW_SIZE } from '@/types/home';

import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeViewTabs } from '@/components/home/HomeViewTabs';
import { DevLoginButton } from '@/components/dev/DevLoginButton';
import { NearbyTeamsSection } from '@/components/home/NearbyTeamsSection';
import { DiscoveryLocationControl } from '@/components/home/DiscoveryLocationControl';
import { useHomeTabTransition } from '@/hooks/useHomeTabTransition';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { HomeTransition } from '@/components/home/HomeTransition';
import { HomeSearchFilters } from '@/components/home/HomeSearchFilters';
import { HomeSearchResults } from '@/components/home/HomeSearchResults';
import type { HomeSearchScope } from '@/utils/homeSearch';

export function HomeDashboardScreen({ tab, initialSearch = false }: { tab: 'for-you' | 'discover'; initialSearch?: boolean }) {
  const { state, destinations, refresh, pullRefresh } = useHomeDashboard();
  const announcements = state.announcements;
  const { selectedTab, displayedTab, selectTab, indicator, contentStyle } = useHomeTabTransition(tab);
  const uid = state.viewer?.uid;
  const [search, setSearch] = useState({ uid, initialSearch, active: initialSearch, query: '', scope: 'all' as HomeSearchScope });
  const resetSearch = search.uid !== uid || search.initialSearch !== initialSearch;
  const currentSearch = resetSearch ? { uid, initialSearch, active: initialSearch, query: '', scope: 'all' as HomeSearchScope } : search;
  // Reset before rendering another account, including a later return to this UID.
  if (resetSearch) setSearch(currentSearch);
  const searching = state.phase === 'ready' && currentSearch.active;
  const cancelSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearch({ uid, initialSearch, active: false, query: '', scope: 'all' });
  }, [uid, initialSearch]);
  useFocusEffect(useCallback(() => {
    if (!searching) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { cancelSearch(); return true; });
    return () => subscription.remove();
  }, [cancelSearch, searching]));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} onAccessibilityEscape={searching ? cancelSearch : undefined} className="flex-1 bg-black">
      <LayoutAnimationConfig key={uid ?? state.phase} skipEntering skipExiting>
      <HomeSearchResults enabled={searching} query={currentSearch.query} scope={currentSearch.scope}
        // Keep Android's refresh wrapper mounted so focusing search retains its input.
        refreshControl={<RefreshControl refreshing={!searching && state.pullRefreshing} enabled={!searching}
          onRefresh={searching ? undefined : pullRefresh} tintColor="#FFD101" colors={['#FFD101']} />}
        header={
        <View className="w-full max-w-[680px] self-center">
          <HomeHeader search={{ query: currentSearch.query, active: searching,
            onFocus: () => setSearch({ ...currentSearch, active: true }),
            onChangeQuery: (query) => setSearch({ ...currentSearch, active: true, query }), onCancel: cancelSearch }} />
          <View className="gap-6 px-4">
            {searching ? <HomeTransition key="search-filters" presence fromBottom className="pb-4">
              <HomeSearchFilters scope={currentSearch.scope} onChangeScope={(scope) => setSearch({ ...currentSearch, scope })} />
            </HomeTransition> : <HomeTransition key="dashboard" presence className="gap-6">
            <HomeViewTabs tab={selectedTab} indicator={indicator} onSelect={selectTab} />
            <Animated.View style={contentStyle}>
            <HomeTransition className="gap-6">
            {state.phase === 'loading' ? <HomeMessage title="Loading your dashboard" loading />
              : state.phase === 'signed-out' ? <View>
                <HomeMessage title="Your community, in one place" message="Sign in to see your team schedule, announcements, and events in your region." action="Log in" onAction={() => router.push('/auth/login')} />
                <DevLoginButton />
                <Link href="/auth/signup" asChild><Text accessibilityRole="link" className="min-h-12 py-3 font-sans-bold text-lg text-brand underline">Create an account</Text></Link>
              </View>
              : state.phase === 'error' ? <HomeMessage title="Unable to load your dashboard" message={state.error ?? undefined} action="Try again" onAction={refresh} />
              : <>
                {state.error && <HomeTransition key="refresh-error" presence><HomeMessage title="Unable to refresh your dashboard" message={state.error} action="Try again" onAction={refresh} /></HomeTransition>}
                {displayedTab === 'discover' && <DiscoveryLocationControl key={state.viewer?.uid} />}
                <HomeSection section={displayedTab === 'discover' ? 'upcoming' : 'schedule'} result={displayedTab === 'discover' ? state.upcoming : state.schedule} />
                {displayedTab === 'discover' && <NearbyTeamsSection />}
                {displayedTab === 'for-you' && (announcements.loading || announcements.error || !!announcements.page?.items.length) && (
                  <HomeTransition className="gap-6">
                    <View className="flex-row flex-wrap items-center justify-between gap-3">
                      <Text accessibilityRole="header" className="font-sans-bold text-[26px] leading-[34px] text-white">Announcements</Text>
                      {announcements.page?.hasMore && <HomeSeeAll label="See all announcements" href={destinations.announcementList} />}
                    </View>
                    {announcements.loading ? <HomeMessage title="Loading announcements" loading />
                      : announcements.error ? <HomeMessage title="Unable to load announcements" message={announcements.error} action="Try again" onAction={refresh} />
                      : announcements.page?.items.slice(0, HOME_PREVIEW_SIZE).map((announcement) => <HomeTransition key={announcement.id} presence><AnnouncementCard announcement={announcement} onPress={destinations.announcement ? () => router.push(destinations.announcement!(announcement.id)) : undefined} /></HomeTransition>)}
                  </HomeTransition>
                )}
              </>}
            </HomeTransition>
            </Animated.View>
            </HomeTransition>}
          </View>
        </View>
      } />
      </LayoutAnimationConfig>
    </SafeAreaView>
  );
}
