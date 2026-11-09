import { Pressable, Text, View } from 'react-native';
import { DiscoveryLocationControl } from '@/components/home/DiscoveryLocationControl';
import type { HomeSearchScope } from '@/utils/homeSearch';

const filters: { scope: HomeSearchScope; label: string }[] = [
  { scope: 'all', label: 'All events' },
  { scope: 'nearby', label: 'Nearby' },
  { scope: 'schedule', label: 'My schedule' },
];

export function HomeSearchFilters({ scope, onChangeScope }: { scope: HomeSearchScope; onChangeScope: (scope: HomeSearchScope) => void }) {
  return <View className="gap-4">
    <View className="flex-row flex-wrap gap-2">
      {filters.map((filter) => <Pressable key={filter.scope} accessibilityRole="button"
        accessibilityLabel={`Filter events: ${filter.label}`} accessibilityState={{ selected: scope === filter.scope }}
        onPress={() => onChangeScope(filter.scope)}
        className={`min-h-12 justify-center rounded-full border px-4 py-2 ${scope === filter.scope ? 'border-brand bg-brand' : 'border-line-dark bg-surface-card'}`}>
        <Text className={`font-sans-bold text-lg ${scope === filter.scope ? 'text-black' : 'text-white'}`}>{filter.label}</Text>
      </Pressable>)}
    </View>
    {scope !== 'schedule' && <DiscoveryLocationControl />}
  </View>;
}
