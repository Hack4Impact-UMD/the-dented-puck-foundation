import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon, type TabName } from '@/components/teams/TabBarIcon';
import { TabBarLabel } from '@/components/teams/TabBarLabel';

const TABS: { name: TabName; title: string }[] = [
  { name: 'home', title: 'Home' },
  { name: 'teams', title: 'Teams' },
  { name: 'chats', title: 'Chats' },
  { name: 'account', title: 'Account' },
];

// From the Figma nav bar; style props can't take Tailwind classes.
const BAR_BACKGROUND = '#1A1A1A';
const BAR_BORDER = '#5C5C5C';
// Figma bar is 96 tall including the ~34 home-indicator strip. The library's default (49) clips the labels.
const BAR_HEIGHT = 62;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Otherwise wide or landscape screens move the labels beside the icons.
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          height: BAR_HEIGHT + insets.bottom,
          backgroundColor: BAR_BACKGROUND,
          borderTopColor: BAR_BORDER,
          borderTopWidth: 1,
          paddingTop: 9,
        },
      }}
    >
      {TABS.map(({ name, title }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            // Role ("tab" on Android, "button" on iOS) and the selected state come from Tabs itself.
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ focused }) => <TabBarIcon name={name} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel title={title} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
