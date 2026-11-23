import type { ComponentType, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { colors } from './tokens';

type Props = ScreenReaderControlProps & {
  /** An SVG icon from `@/assets/icons`. */
  icon: ComponentType<SvgProps>;
  /** Spoken name, for example "Notification settings". Icon-only buttons need one. */
  label: string;
  onPress: () => void;
  /** Glyph size. Default 24 (Figma uses 26 for the chat gear and info icons). */
  iconSize?: number;
  /** Glyph color. Default white. */
  color?: string;
  /**
   * `plain`: just the icon in a 48 px target (header actions).
   * `outlined`: 52 px box with a grey border (the chat composer's attach button).
   */
  variant?: 'plain' | 'outlined';
  /** Drawn on top of the icon's top-right corner, for example an unread dot. */
  badge?: ReactNode;
};

// Figma: header icon buttons (back, close, gear, info) and the chat composer's "+" button.
export function IconButton({
  icon: Icon,
  label,
  onPress,
  iconSize = 24,
  color = colors.white,
  variant = 'plain',
  badge,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? label}
      accessibilityHint={screenReaderHint}
      className={`items-center justify-center active:opacity-70 ${
        variant === 'outlined'
          ? 'h-[52px] w-[52px] rounded-lg border-2 border-line bg-surface-alt-dark'
          : 'h-12 w-12'
      }`}
    >
      <View>
        <Icon width={iconSize} height={iconSize} color={color} />
        {badge ? <View className="absolute -right-1 -top-1">{badge}</View> : null}
      </View>
    </Pressable>
  );
}
