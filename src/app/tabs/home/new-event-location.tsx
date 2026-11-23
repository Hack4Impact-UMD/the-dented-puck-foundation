import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import SearchIcon from "@/assets/icons/search.svg";

export default function NewEventLocation() {
  const [search, setSearch] = useState("");

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
        className="font-sans-bold text-header text-white text-xl"
      >
        Recent
      </Text>

      <View className="flex-1 gap-4">
        <Text className="font-sans text-lg text-white">No recent locations</Text>
      </View>
    </ScrollView>
  );
}
