import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

export function HomeSeeAll({ label, href }: { label: string; href?: Href }) {
  const unavailable = !href;
  return <View className="shrink items-end">
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable }}
      accessibilityHint={unavailable ? 'The full list is not available yet' : 'Opens the full list'}
      disabled={unavailable}
      onPress={href ? () => router.push(href) : undefined}
      hitSlop={8}
      className={`min-h-8 justify-center ${unavailable ? 'opacity-50' : 'active:opacity-70'}`}
    >
      <Text className="font-sans-bold text-lg leading-6 text-white underline">See all</Text>
    </Pressable>
    {unavailable && <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      className="font-sans text-sm text-ink-subtle">Unavailable</Text>}
  </View>;
}
