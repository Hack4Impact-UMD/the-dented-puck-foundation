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
            className={`min-h-10 flex-1 items-center justify-center rounded-full px-4 active:opacity-70 ${
              selected ? 'bg-brand' : 'border border-brand bg-transparent'
            }`}
          >
            <Text
              className={`font-sans-bold text-base ${
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
