import { Pressable, View, Text } from "react-native";
import { usePathname } from "expo-router";
import ChevronBackIcon from "@/assets/icons/chevron-back.svg";
import AppButton from "@/components/team/AppButton";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from "@/components/accessibility";

/** Spoken text for each stop in a `TeamHeader`. */
export type TeamHeaderScreenReaderParts = {
  /** The back chevron. Defaults: label "Back", hint "Return to the previous screen". */
  back?: ScreenReaderControlText;
  /** The "Find a team" title (Find a Team route only). */
  title?: ScreenReaderStopText;
  /** The Create action. Defaults: label "Create", hint "Opens the create team screen". */
  create?: ScreenReaderControlText;
};

type TeamHeaderProps = ScreenReaderProps & {
  onBack: () => void;
  onCreate: () => void;
  screenReaderParts?: TeamHeaderScreenReaderParts;
};

// the top bar of the Team Info and Find Team pages
export default function TeamHeader({ onBack, onCreate, screenReaderParts, hideFromScreenReader, screenReaderOrder }: TeamHeaderProps) {
  const pathname = usePathname();
  const isFindTeam = pathname === "/tabs/teams/find";
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const { back, title, create } = screenReaderParts ?? {};

  return (
    // Figma: Find a team (4200) has a 60px bar (find.tsx draws the rule below it); Team detail
    // (4300) has a bare 48px bar because the team card under it draws its own top border.
    <View {...screenReaderProps} className={`flex-row items-center w-full px-2 ${isFindTeam ? "min-h-[60px]" : "min-h-12"}`}>
      <View className="w-[72px]">
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(onBack, back?.pressAnnouncement)}
          className="w-12 h-12 items-center justify-center active:opacity-70"
          accessibilityLabel={back?.label ?? "Back"}
          accessibilityRole="button"
          accessibilityHint={back?.hint ?? "Return to the previous screen"}
        >
          <ChevronBackIcon width={24} height={24} />
        </Pressable>
      </View>

      <View
        className="flex-1 h-12 items-center justify-center"
        accessible={isFindTeam}
        accessibilityRole={isFindTeam ? "header" : undefined}
        accessibilityLabel={isFindTeam ? title?.label ?? "Find a team" : undefined}
      >
        {isFindTeam && (
          <Text
            accessible={false}
            className="text-white font-sans-bold text-h3"
          >
            Find a team
          </Text>
        )}
      </View>

      <View className="w-[72px] items-end">
        <AppButton
          title="Create"
          onPress={onCreate}
          variant="primary"
          accessibilityRole="button"
          screenReaderLabel={create?.label ?? "Create"}
          screenReaderHint={create?.hint ?? "Opens the create team screen"}
          screenReaderPressAnnouncement={create?.pressAnnouncement}
          hideFromScreenReader={hideFromScreenReader}
          className="min-h-12"
        />
      </View>
    </View>
  );
}
