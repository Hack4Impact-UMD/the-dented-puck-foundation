import * as Location from 'expo-location';
import { validCoordinates } from '@/utils/homeLocation';
import type { HomeLocation } from '@/types/home';

export async function requestDiscoveryLocation(): Promise<HomeLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Location permission was not granted. Enable location in your phone settings to try again.');
  if (!await Location.hasServicesEnabledAsync()) throw new Error('Location services are off. Enable location on your phone to try again.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Finding your location took too long. Please try again.')), 15_000); }),
    ]);
    if (!validCoordinates(position.coords)) throw new Error('Your phone returned an unavailable location. Please try again.');
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, label: 'your current location', source: 'device' };
  } finally { if (timer) clearTimeout(timer); }
}
