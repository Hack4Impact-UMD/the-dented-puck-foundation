import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import ChevronForwardIcon from '@/assets/icons/chevron-forward.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';
import { SelectionIndicator } from './SelectionIndicator';
import { colors } from './tokens';

export type ListRowProps = ScreenReaderControlProps & {
  title: string;
  /** Second line under the title, in grey (role, city, setting value). */
  subtitle?: string;
  /** Text on the right, before the accessory (Account: "Jordan Lee"; members: "Coach"). */
  value?: string;
  /** `muted` grey (default; member roles) or `default` white (account settings values). */
  valueTone?: 'muted' | 'default';
  /** Avatar or picture on the left. */
  leading?: ReactNode;
  /** 24 px icon on the left (grouped settings rows). */
  icon?: ComponentType<SvgProps>;
  /**
   * Right side: `chevron` (opens another screen), `selected` / `unselected` (a checkbox-like
   * yellow check circle), or an element. For text on the right, use `value`.
   */
  accessory?: 'chevron' | 'selected' | 'unselected' | ReactElement;
  onPress?: () => void;
  /** Rule under the row: `subtle` (#2B2B2B, chat lists), `default` (#767676, location results) or `none`. */
  divider?: 'none' | 'subtle' | 'default';
  /** `regular` titles for plain name lists (Replies). Default `bold`. */
  titleWeight?: 'bold' | 'regular';
  /** Minimum row height: 48, 56 (default) or 64 px. */
  size?: 'compact' | 'default' | 'large';
  /** Horizontal padding inside the row; used by `ListGroup` cards. */
  inset?: boolean;
};

const MIN_HEIGHT = { compact: 'min-h-12', default: 'min-h-14', large: 'min-h-16' } as const;

/**
 * One row in a list. Covers the Figma account settings rows (label, value, chevron),
 * member rows (avatar, name, role), New message people (avatar, name, role, check circle),
 * location results (name over city) and reply names. With `onPress` the row is a button
 * (or a checkbox when `accessory` is `selected` / `unselected`) and one reading stop.
 */
export function ListRow({
  title,
  subtitle,
  value,
  valueTone = 'muted',
  leading,
  icon: Icon,
  accessory,
  onPress,
  divider = 'none',
  titleWeight = 'bold',
  size = 'default',
  inset = false,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: ListRowProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const selectable = accessory === 'selected' || accessory === 'unselected';
  const spoken = screenReaderLabel ?? [title, subtitle, value].filter(Boolean).join(', ');

  const content = (
    <>
      {Icon ? <Icon width={24} height={24} color={colors.white} /> : null}
      {leading}
      <View className="flex-1">
        <Text className={`text-body text-white ${titleWeight === 'bold' ? 'font-sans-bold' : 'font-sans'}`}>{title}</Text>
        {subtitle ? <Text className="font-sans text-body text-ink-muted-dark">{subtitle}</Text> : null}
      </View>
      {value ? <Text className={`font-sans text-body ${valueTone === 'muted' ? 'text-ink-muted-dark' : 'text-white'}`}>{value}</Text> : null}
      {accessory === 'chevron' ? (
        <ChevronForwardIcon width={24} height={24} />
      ) : selectable ? (
        <SelectionIndicator selected={accessory === 'selected'} />
      ) : (
        accessory
      )}
    </>
  );

  const className = `${MIN_HEIGHT[size]} flex-row items-center gap-3.5 py-2 ${inset ? 'px-3.5' : ''} ${
    divider === 'none' ? '' : `border-b ${divider === 'subtle' ? 'border-line-faint' : 'border-line'}`
  }`;

  if (!onPress) {
    return (
      <View {...screenReaderProps} accessible accessibilityRole="text" accessibilityLabel={spoken} className={className}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityLabel={spoken}
      accessibilityHint={screenReaderHint}
      accessibilityState={selectable ? { checked: accessory === 'selected' } : undefined}
      className={`${className} active:opacity-70`}
    >
      {content}
    </Pressable>
  );
}
