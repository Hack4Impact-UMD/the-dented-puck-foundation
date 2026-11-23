import { Pressable } from "react-native";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from "@/components/accessibility";
import { TabBarIcon, type TabName } from "./TabBarIcon";
import { TabBarLabel } from "./TabBarLabel";

type TabBarButtonProps = ScreenReaderControlProps & {
  name: TabName;
  focused: boolean;
  onPress: () => void;
};

export function TabBarButton({
  name,
  focused,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: TabBarButtonProps) {
  const title = name[0].toUpperCase() + name.slice(1);
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      accessibilityRole="tab"
      accessibilityLabel={screenReaderLabel ?? title}
      accessibilityHint={screenReaderHint}
      accessibilityState={{ selected: focused }}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      className="min-h-16 items-center justify-center gap-0.5"
    >
      <TabBarIcon name={name} focused={focused} />
      <TabBarLabel title={title} focused={focused} />
    </Pressable>
  );
}
