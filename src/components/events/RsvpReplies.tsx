import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';

export type RsvpReplyGroup = {
  /** For example "going", "maybe", "can't go". The heading reads "{names.length} {label}". */
  label: string;
  names: string[];
};

type Props = ScreenReaderProps & {
  groups: RsvpReplyGroup[];
  /** Shows "Replies" above the groups (event details); leave off on the full Replies screen. */
  heading?: string;
  /** Names shown per group. Default: all. Event details shows 3 going. */
  limit?: number;
  /** Shows a "See all replies" link. */
  onSeeAll?: () => void;
  screenReaderParts?: { seeAll?: ScreenReaderControlText };
};

/**
 * Who replied to an event, grouped by answer (Figma 6450 coach event details and 6452 Replies).
 * Each group heading and each name is a reading stop. Groups with nobody in them are skipped.
 */
export function RsvpReplies({ groups, heading, limit, onSeeAll, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const shown = groups.filter((group) => group.names.length > 0);

  return (
    <View {...screenReaderProps} className="gap-2">
      {heading ? (
        <Text accessibilityRole="header" className="min-h-10 font-sans-bold text-h3 text-white">
          {heading}
        </Text>
      ) : null}
      <View className="gap-8">
        {shown.map((group) => (
          <View key={group.label} className="gap-1 pt-1">
            <Text accessibilityRole="header" className="font-sans-bold text-body text-white">
              {group.names.length} {group.label}
            </Text>
            {(limit === undefined ? group.names : group.names.slice(0, limit)).map((name, index) => (
              <View key={`${name}-${index}`} className="min-h-12 justify-center">
                <Text className="font-sans text-[18px] text-white">{name}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      {onSeeAll ? (
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(onSeeAll, screenReaderParts?.seeAll?.pressAnnouncement)}
          accessibilityRole="button"
          accessibilityLabel={screenReaderParts?.seeAll?.label ?? 'See all replies'}
          accessibilityHint={screenReaderParts?.seeAll?.hint}
          className="min-h-12 justify-center self-start active:opacity-70"
        >
          <Text className="font-sans-bold text-body text-white underline">See all replies</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
