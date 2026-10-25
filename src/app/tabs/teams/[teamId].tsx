import { useLocalSearchParams } from "expo-router";

const { teamId } = useLocalSearchParams<{ teamId: string }>();
