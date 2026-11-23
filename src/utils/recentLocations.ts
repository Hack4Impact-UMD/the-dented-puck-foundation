import AsyncStorage from "@react-native-async-storage/async-storage";
const RECENT_KEY = "recentLocations";

const MAX_RECENT = 5;

export async function getRecentLocations(): Promise<string[]> {
  try {
    const resp = await AsyncStorage.getItem(RECENT_KEY);
    if (resp) {
      const locations = JSON.parse(resp);
      if (Array.isArray(locations)) {
        return locations;
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching recent locations:", error);
    return [];
  }
}

export async function addRecentLocation(location: string) {
  const currList = await getRecentLocations();
  const newList = [
    location,
    ...currList.filter((loc) => loc !== location),
  ].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(newList));
}
