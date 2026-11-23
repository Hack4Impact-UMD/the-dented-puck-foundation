import type { Ref } from "react";
import { Image, Pressable, Text, View, type TextInstance } from "react-native";
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from "@/components/accessibility";

/** Spoken text for each stop in an `AuthHeader`. */
export type AuthHeaderScreenReaderParts = {
  /** The title. Defaults to `title`. */
  title?: ScreenReaderStopText;
  /** The X button. Default label: "Close". */
  close?: ScreenReaderControlText;
};

interface AuthHeaderProps extends ScreenReaderProps {
  title: string;
  onClose: () => void;
  /** Ref to the title, so the screen can move screen-reader focus to it when it opens (see `AuthScreen`). */
  titleRef?: Ref<TextInstance>;
  screenReaderParts?: AuthHeaderScreenReaderParts;
}

export function AuthHeader({
  title,
  onClose,
  titleRef,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: AuthHeaderProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const close = screenReaderParts?.close;

  return (
    <View {...screenReaderProps} className="min-h-[60px] flex-row items-center border-b border-line-dark px-2">
      <View className="h-12 w-12" />
      <Text
        ref={titleRef}
        accessibilityRole="header"
        accessibilityLabel={screenReaderParts?.title?.label}
        className="flex-1 text-center font-sans-bold text-[21px] leading-[30px] text-white"
      >
        {title}
      </Text>
      <Pressable
        {...skipFocusProps(hideFromScreenReader)}
        onPress={withPressAnnouncement(onClose, close?.pressAnnouncement)}
        accessibilityRole="button"
        accessibilityLabel={close?.label ?? "Close"}
        accessibilityHint={close?.hint}
        className="h-12 w-12 items-center justify-center active:opacity-70"
      >
        <Image source={require("@/assets/icons/close.png")} style={{ width: 24, height: 24 }} />
      </Pressable>
    </View>
  );
}
