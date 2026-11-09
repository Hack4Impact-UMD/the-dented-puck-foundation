import type { HomeCoordinates } from '@/types/home';

export const NEARBY_RADIUS_KM = 100;

export function validCoordinates(value: unknown): value is HomeCoordinates {
  if (!value || typeof value !== 'object') return false;
  const point = value as HomeCoordinates;
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

/** Great-circle distance, used for both team ranking and the discovery radius. */
export function distanceKm(a: HomeCoordinates, b: HomeCoordinates): number {
  if (!validCoordinates(a) || !validCoordinates(b)) return Infinity;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitude = radians(b.latitude - a.latitude);
  const longitude = radians(b.longitude - a.longitude);
  const haversine = Math.sin(latitude / 2) ** 2 + Math.cos(radians(a.latitude)) *
    Math.cos(radians(b.latitude)) * Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export function isNearby(origin: HomeCoordinates, destination?: HomeCoordinates): boolean {
  return !!destination && distanceKm(origin, destination) <= NEARBY_RADIUS_KM;
}
