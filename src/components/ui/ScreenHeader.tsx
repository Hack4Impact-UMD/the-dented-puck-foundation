import type { ComponentType, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import ChevronBackIcon from '@/assets/icons/chevron-back.svg';
import CloseIcon from '@/assets/icons/close.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  useSkipSubtreeFocusProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';
import { colors } from './tokens';

/**
 * One end of the header.
 * - `back`: chevron (spoken "Back").
 * - `close`: X (spoken "Close").
 * - `text`: a word such as "Cancel", "Edit" or "Create"; `withBackIcon` puts a chevron before it ("< Cancel").
 * - `icon`: any icon from `@/assets/icons`, such as the gear or info icon; `label` is required.
 */
export type ScreenHeaderAction = ScreenReaderControlText & { onPress: () => void } & (
    | { kind: 'back' | 'close' }
    | { kind: 'text'; text: string; withBackIcon?: boolean; underline?: boolean; /** Account edit screens use `regular` for "Cancel". */ weight?: 'bold' | 'regular' }
    | { kind: 'icon'; icon: ComponentType<SvgProps>; label: string; iconSize?: number }
  );

/** Spoken text for the title stop. The actions take their spoken text on the action itself. */
export type ScreenHeaderScreenReaderParts = { title?: ScreenReaderStopText };

type Props = ScreenReaderProps & {
  title?: string;
  /** `default`: 21/30 (most screens). `large`: 26/34 (account edit screens and chat lists). */
  titleSize?: 'default' | 'large';
  /** `center` (default) or `start` (chat screens, channel info). */
  titleAlign?: 'center' | 'start';
  leading?: ScreenHeaderAction;
  trailing?: ScreenHeaderAction;
  /** Rule under the header: `default` (#5C5C5C), `subtle` (#2B2B2B, chat screens) or `none`. */
  divider?: 'default' | 'subtle' | 'none';
  /** Replaces the title, for example a chat avatar and name. */
  children?: ReactNode;
  screenReaderParts?: ScreenHeaderScreenReaderParts;
};

const DEFAULT_LABEL = { back: 'Back', close: 'Close' } as const;

function HeaderAction({ action, hidden }: { action: ScreenHeaderAction; hidden?: boolean }) {
  const onPress = withPressAnnouncement(action.onPress, action.pressAnnouncement);
  const common = {
    ...skipFocusProps(hidden),
    onPress,
    accessibilityRole: 'button' as const,
    accessibilityHint: action.hint,
  };

  if (action.kind === 'text') {
    return (
      <Pressable
        {...common}
        accessibilityLabel={action.label ?? action.text}
        className="min-h-12 flex-row items-center gap-0.5 px-2 active:opacity-70"
      >
        {action.withBackIcon ? <ChevronBackIcon width={24} height={24} /> : null}
        <Text className={`${action.weight === 'regular' ? 'font-sans' : 'font-sans-bold'} text-body text-white ${action.underline ? 'underline' : ''}`}>{action.text}</Text>
      </Pressable>
    );
  }

  const Icon = action.kind === 'icon' ? action.icon : action.kind === 'back' ? ChevronBackIcon : CloseIcon;
  const size = action.kind === 'icon' ? (action.iconSize ?? 24) : 24;
  const label = action.kind === 'icon' ? action.label : DEFAULT_LABEL[action.kind];
  return (
    <Pressable {...common} accessibilityLabel={action.label ?? label} className="h-12 w-12 items-center justify-center active:opacity-70">
      <Icon width={size} height={size} color={colors.white} />
    </Pressable>
  );
}

/**
 * Top bar for any screen: an optional action on each side and a title. Covers the Figma
 * headers for auth, create team, new event, notifications, account edits ("Cancel" + large
 * title), chat ("< Cancel", start-aligned titles, gear and info icons) and coach event details ("Edit").
 * Reading order: leading action, title, trailing action.
 */
export function ScreenHeader({
  title,
  titleSize = 'default',
  titleAlign = 'center',
  leading,
  trailing,
  divider = 'default',
  children,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  // `children` can hold controls of its own.
  const subtreeFocusProps = useSkipSubtreeFocusProps(hideFromScreenReader);
  const centered = titleAlign === 'center';
  const titleNode =
    children ??
    (title ? (
      <Text
        accessibilityRole="header"
        accessibilityLabel={screenReaderParts?.title?.label}
        numberOfLines={1}
        className={`font-sans-bold text-white ${titleSize === 'large' ? 'text-h2' : 'text-h3'} ${centered ? 'text-center' : ''}`}
      >
        {title}
      </Text>
    ) : null);

  return (
    <View
      {...screenReaderProps}
      {...subtreeFocusProps}
      className={`min-h-[60px] flex-row items-center px-2 ${
        divider === 'none' ? '' : `border-b ${divider === 'subtle' ? 'border-line-faint' : 'border-line-dark'}`
      }`}
    >
      {centered ? (
        <>
          {/* Equal side columns keep the title centered whatever the actions' widths. */}
          <View className="flex-1 flex-row justify-start">
            {leading ? <HeaderAction action={leading} hidden={hideFromScreenReader} /> : null}
          </View>
          <View className="max-w-[70%] shrink">{titleNode}</View>
          <View className="flex-1 flex-row justify-end">
            {trailing ? <HeaderAction action={trailing} hidden={hideFromScreenReader} /> : null}
          </View>
        </>
      ) : (
        <>
          {leading ? <HeaderAction action={leading} hidden={hideFromScreenReader} /> : null}
          <View className={`flex-1 ${leading ? 'pl-1' : 'pl-3'}`}>{titleNode}</View>
          {trailing ? <HeaderAction action={trailing} hidden={hideFromScreenReader} /> : null}
        </>
      )}
    </View>
  );
}
