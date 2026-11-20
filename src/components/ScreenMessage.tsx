import { ActivityIndicator, Text, View } from 'react-native';

type Props =
  | { loading: true; label: string; text?: never; alert?: never }
  | { loading?: false; text: string; alert?: boolean; label?: never };

// Full-screen loading spinner or message (empty, error, signed out) for list screens.
export function ScreenMessage(props: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-black px-4">
      {props.loading ? (
        <ActivityIndicator color="#FFD101" accessibilityLabel={props.label} />
      ) : (
        <Text
          accessibilityRole={props.alert ? 'alert' : 'text'}
          className="text-center font-sans text-xl text-white"
        >
          {props.text}
        </Text>
      )}
    </View>
  );
}
