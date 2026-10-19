import { useLocalSearchParams } from "expo-router";

const { token } = useLocalSearchParams<{ token: string }>();
