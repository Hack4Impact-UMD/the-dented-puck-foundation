import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DiscoverScreen() {
  const { focusTab } = useLocalSearchParams<{ focusTab?: string }>();
  return <Redirect href={{ pathname: '/tabs/home', params: { view: 'discover', ...(focusTab === '1' ? { focusTab } : {}) } }} />;
}
