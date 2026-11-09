import type { HomeDestinations } from '@/types/home';

// Only the existing Team Info route is confirmed in this checkout. The owners
// of See All, Event Detail, Notifications, and Account supply their routes later.
export const homeDestinations: HomeDestinations = {
  team: (teamId) => ({ pathname: '/tabs/teams/[teamId]', params: { teamId } }),
};
