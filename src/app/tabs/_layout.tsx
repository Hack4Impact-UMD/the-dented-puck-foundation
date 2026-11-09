import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Tabs, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomeProvider, useHomeDashboard } from '@/hooks/useHomeDashboard';
import { SandboxControls } from '@/components/dev/SandboxControls';
import { homeDestinations } from '@/config/homeDestinations';

const icons = {
  Home: require('@/assets/home/home.png'),
  Teams: require('@/assets/home/teams.png'),
  Chats: require('@/assets/home/chats.png'),
  Account: require('@/assets/home/account.png'),
};

export const unstable_settings = { anchor: 'home' };

function DashboardTabs() {
  const { destinations, isPreview } = useHomeDashboard();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, emitter, navigateToTab }) => (
        <SafeAreaView edges={['bottom', 'left', 'right']} className="border-t border-line-dark bg-surface-navigation">
          {isPreview && <SandboxControls />}
          <View accessibilityRole={Platform.OS === 'ios' ? undefined : 'tablist'} className="flex-row flex-wrap pt-2">
            {(['Home', 'Teams', 'Chats', 'Account'] as const).map((label) => {
              const routeName = label === 'Home' ? 'home' : label.toLowerCase();
              const selected = state.routes[state.index]?.name === routeName;
              const href = label === 'Home' ? '/tabs/home' as const : destinations[label.toLowerCase() as 'teams' | 'chats' | 'account'];
              return (
                <Pressable
                  key={label}
                  accessibilityRole={Platform.OS === 'ios' ? 'button' : 'tab'}
                  accessibilityLabel={label}
                  accessibilityState={{ selected, disabled: !href }}
                  accessibilityHint={href ? undefined : `${label} navigation is not available yet`}
                  disabled={!href}
                  onPress={() => {
                    const route = state.routes.find((item) => item.name === routeName);
                    if (route && (label === 'Home' || label === 'Teams')) {
                      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                      if (!event.defaultPrevented) navigateToTab(route.key);
                    } else if (href) router.navigate(href);
                  }}
                  className="min-h-16 items-center gap-0.5 px-1 pb-2 active:opacity-70"
                  style={{ width: fontScale > 1.6 ? '50%' : '25%' }}
                >
                  <View className={`h-8 w-14 items-center justify-center rounded-2xl ${selected ? 'bg-brand' : ''}`}>
                    <Image accessible={false} importantForAccessibility="no" source={icons[label]} style={{ width: 24, height: 24, tintColor: selected ? '#010101' : '#FFFFFF' }} />
                  </View>
                  <Text className={`text-center text-lg leading-6 text-white ${selected ? 'font-sans-bold' : 'font-sans'}`}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      )}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="teams" options={{ title: 'Teams' }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return <HomeProvider destinations={homeDestinations}><StatusBar style="light" /><DashboardTabs /></HomeProvider>;
}
