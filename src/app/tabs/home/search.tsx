import { Redirect } from 'expo-router';

export default function SearchScreen() {
  return <Redirect href={{ pathname: '/tabs/home', params: { search: '1' } }} />;
}
