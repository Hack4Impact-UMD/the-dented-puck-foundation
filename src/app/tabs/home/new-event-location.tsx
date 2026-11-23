import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import SearchIcon from "@/assets/icons/search.svg";
import { router } from "expo-router";
import { addRecentLocation, getRecentLocations } from "@/utils/recentLocations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { splitLocation } from "@/components/events/eventFormat";

export default function NewEventLocation() {
  const [search, setSearch] = useState("");
  const { data: recent = [] } = useQuery({
    queryKey: ["recentLocations"],
    queryFn: getRecentLocations,
  });

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
        Recent
      </Text>

      <View className="gap-4">
        {recent.length === 0 ? (
          <Text className="font-sans text-base text-ink-subtle">
            No recent locations
          </Text>
        ) : (
          recent.map((location) => {
            const { name, details } = splitLocation(location);
            return (
              <Pressable
                key={location}
                onPress={() => pickLocation.mutate(location)}
                className="min-h-14 justify-center border-b border-surface-field py-3"
              >
                <Text className="font-sans-bold text-base text-white">
                  {name}
                </Text>
                <Text className="font-sans text-sm text-ink-subtle">
                  {details.join(", ")}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
