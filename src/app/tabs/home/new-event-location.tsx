import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import SearchIcon from "@/assets/icons/search.svg";
import { router } from "expo-router";
import { addRecentLocation, getRecentLocations } from "@/utils/recentLocations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { splitLocation } from "@/components/events/eventFormat";

// Turns what the user typed into a list of real places.
// Only places the map finds (with coordinates) are kept, and the saved text
// comes from the map's address, never from what the user typed.
async function searchAddresses(text: string): Promise<string[]> {
  // Android needs location permission to look up addresses.
  if (Platform.OS === "android") {
    await Location.requestForegroundPermissionsAsync();
  }

  let matches: Location.LocationGeocodedLocation[] = [];
  try {
    matches = await Location.geocodeAsync(text);
  } catch {
    return []; // the map found nothing
  }

  const results: string[] = [];
  for (const match of matches.slice(0, 5)) {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: match.latitude,
      longitude: match.longitude,
    });
    if (!place) continue;

    const street =
      place.streetNumber && place.street
        ? place.streetNumber + " " + place.street
        : place.street;
    const title = place.name ?? street;

    // Skip places without a name/street or a city.
    if (!title || !place.city) continue;

    // e.g. "8500 Paint Branch Dr, College Park, MD"
    const parts = [title, street, place.city, place.region].filter(
      (part): part is string => !!part,
    );
    const uniqueParts = parts.filter((part, i) => parts.indexOf(part) === i);
    const location = uniqueParts.join(", ");

    if (!results.includes(location)) results.push(location);
  }
  return results;
}

// One row in the Recent or Results list.
function LocationRow({
  location,
  onPress,
}: {
  location: string;
  onPress: () => void;
}) {
  const { name, details, spoken } = splitLocation(location);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Picks this location"
      onPress={onPress}
      className="min-h-14 justify-center border-b border-surface-field py-3"
    >
      <Text className="font-sans-bold text-base text-white">{name}</Text>
      <Text className="font-sans text-sm text-ink-subtle">
        {details.join(", ")}
      </Text>
    </Pressable>
  );
}

export default function NewEventLocation() {
  const [search, setSearch] = useState("");
  const { data: recent = [] } = useQuery({
    queryKey: ["recentLocations"],
    queryFn: getRecentLocations,
  });

  // Wait until the user stops typing for half a second before searching,
  // so we don't search on every single letter.
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearchText(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["geocode", searchText],
    queryFn: () => searchAddresses(searchText),
    enabled: searchText.length > 3,
  });

  // Tell screen reader users how many results were found.
  useEffect(() => {
    if (searchText.length > 3 && !isFetching) {
      AccessibilityInfo.announceForAccessibility(
        results.length === 1 ? "1 result" : results.length + " results",
      );
    }
  }, [searchText, isFetching, results.length]);

  // When a location is picked: save it to Recent, refresh the Recent list,
  // then go back to the previous page.
  const queryClient = useQueryClient();
  const pickLocation = useMutation({
    mutationFn: addRecentLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentLocations"] });
      // TODO: send location back to new-event once Ryan's page is merged
      router.back();
    },
  });
  // TEMP test: to preview rows without saved data, uncomment the next line
  // and use testRecent instead of recent in the list below.
  // const testRecent = ["College Park Ice Arena, 8131 Paint Branch Dr, College Park, MD", "Rockville Ice Arena, Rockville, MD"];

  // Show search results while typing, otherwise show Recent.
  const isSearching = search.trim().length > 0;
  let resultsMessage = "";
  if (searchText.length <= 3) {
    resultsMessage = "Type a full address to search";
  } else if (isFetching) {
    resultsMessage = "Searching…";
  } else if (results.length === 0) {
    resultsMessage = "No results";
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow gap-6 p-4"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View className="min-h-14 flex-row items-center gap-3 rounded border border-white bg-surface-field px-3.5">
        <SearchIcon width={24} height={24} />
        <TextInput
          accessibilityRole="search"
          accessibilityLabel="Search locations"
          accessibilityHint="Search by place name or address"
          autoCapitalize="none"
          className="min-h-14 flex-1 font-sans text-lg text-white"
          onChangeText={setSearch}
          placeholder="Search by name or address"
          placeholderTextColor="#BDBDBD"
          returnKeyType="search"
          value={search}
        />
      </View>

      <Text
        accessibilityRole="header"
        className="font-sans-bold text-[26px] leading-[34px] text-white"
      >
        {isSearching ? "Results" : "Recent"}
      </Text>

      {isSearching ? (
        <View className="gap-4">
          {resultsMessage !== "" && (
            <Text
              accessibilityLiveRegion="polite"
              className="font-sans text-base text-ink-subtle"
            >
              {resultsMessage}
            </Text>
          )}
          {!isFetching &&
            results.map((location) => (
              <LocationRow
                key={location}
                location={location}
                onPress={() => pickLocation.mutate(location)}
              />
            ))}
        </View>
      ) : (
        <View className="gap-4">
          {recent.length === 0 ? (
            <Text className="font-sans text-base text-ink-subtle">
              No recent locations
            </Text>
          ) : (
            recent.map((location) => (
              <LocationRow
                key={location}
                location={location}
                onPress={() => pickLocation.mutate(location)}
              />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
