import { Pressable, Text, View } from 'react-native';

export type NotificationTab = 'unread' | 'read';

type Props = {
  value: NotificationTab;
  onChange: (tab: NotificationTab) => void;
};

const TABS: { id: NotificationTab; label: string }[] = [
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
];

export function NotificationTabs({ value, onChange }: Props) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row gap-3 px-4 pb-4 pt-2"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            accessibilityHint={`Shows ${tab.label.toLowerCase()} notifications`}
            className={`min-h-8 items-center justify-center rounded-md border border-brand px-3 active:opacity-70 ${
              selected ? 'bg-brand' : 'bg-[#2B2400]'
            }`}
          >
            <Text
              className={`font-sans-bold text-sm ${
                selected ? 'text-on-brand' : 'text-brand'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
