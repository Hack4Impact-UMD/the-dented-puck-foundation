import type { HomeDestinations } from '@/types/home';

// Only the existing Team Info route is confirmed in this checkout. The owners
// of See All, Event Detail, Notifications, and Account supply their routes later.
export const homeDestinations: HomeDestinations = {
  team: (teamId) => ({ pathname: '/tabs/teams/[teamId]', params: { teamId } }),
  nearbyTeamList: '/tabs/home/nearby-teams',
  // Only Upcoming has a See All page (#38); Schedule's "See all" stays unavailable.
  eventList: (section) => (section === 'upcoming' ? '/tabs/home/upcoming-events' : undefined),
  event: (eventId) => ({ pathname: '/tabs/home/event/[eventId]', params: { eventId } }),
};
