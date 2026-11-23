import { Text, View } from 'react-native';
import AppButton from '@/components/team/AppButton';
import { replyHeading } from './replyText';

const TITLE = 'Replies';
const PREVIEW = 3;

type Props = { going: string[] | null; onSeeAll: () => void }; // null: replies couldn't load

// 6450, annotations 6 and 7: "Replies" and "8 going" are headings, each name is its own stop,
// then See all replies (opens 6452).
export function ReplySummary({ going, onSeeAll }: Props) {
  const heading = going ? replyHeading('going', going.length) : null;
  return (
    <View className="items-start gap-3">
      <Text accessibilityRole="header" accessibilityLabel={TITLE} className="font-sans-bold text-xl text-white">
        {TITLE}
      </Text>
      {heading ? (
        <Text accessibilityRole="header" accessibilityLabel={heading} className="font-sans-bold text-lg text-white">
          {heading}
        </Text>
      ) : (
        <Text accessibilityRole="alert" className="font-sans text-base text-danger-dark">
          {"Couldn't load replies. Try again later."}
        </Text>
      )}
      {(going ?? []).slice(0, PREVIEW).map((name, index) => (
        <Text key={`${name}-${index}`} accessibilityRole="text" accessibilityLabel={name} className="font-sans text-lg text-white">
          {name}
        </Text>
      ))}
      <AppButton title="See all replies" onPress={onSeeAll} />
    </View>
  );
}
