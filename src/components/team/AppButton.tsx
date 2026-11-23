import React, { type ComponentType } from 'react';
import { Platform, Pressable, Text, type ViewInstance, type AccessibilityState } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
    skipFocusProps,
    useScreenReaderProps,
    withPressAnnouncement,
    type ScreenReaderControlProps,
} from '@/components/accessibility';

type Variant = 'primary' | 'secondary' | 'outline' | 'subtle';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type AppButtonProps = ScreenReaderControlProps & {
    title: string;
    ref?: React.Ref<ViewInstance>;
    onPress: () => void;
    variant?: Variant;
    icon?: IconName;
    /** An SVG from `@/assets/icons`; used instead of `icon` (an Ionicons name) to match the Figma glyphs. */
    svgIcon?: ComponentType<SvgProps>;
    /** `compact`: 52 px tall, 8 px corners, 18 px text (chat screens: New message, Start conversation, Done). */
    size?: 'default' | 'compact';
    disabled?: boolean;
    /** @deprecated Use `screenReaderLabel`. Still works; `screenReaderLabel` wins if both are set. */
    accessibilityLabel?: string;
    accessibilityRole?: 'button';
    /** @deprecated Use `screenReaderHint`. Still works; `screenReaderHint` wins if both are set. */
    accessibilityHint?: string;
    accessibilityState?: AccessibilityState;
    className?: string;
};

const variants: Record<Variant, { container: string; text: string; iconColor?: string }> = {
    primary:    { container: 'bg-transparent', text: 'text-[18px] text-white underline', iconColor: '#FFFFFF'},
    secondary:  { container: 'bg-brand', text: 'text-[20px] text-on-brand', iconColor: '#010101' },
    subtle:     { container: '', text: 'text-label text-white' },
    outline:    { container: 'border-2 border-brand bg-brand-soft-dark', text: 'text-[20px] text-brand', iconColor: '#FFD101' },
};

const DISABLED = { container: 'border-2 border-line bg-surface-alt-dark', text: 'text-[20px] text-ink-muted-dark', iconColor: '#B3B3B3' };

// button component with varying styles
export default function AppButton({
    title,
    ref,
    onPress,
    variant = 'primary',
    svgIcon: SvgIcon,
    size = 'default',
    icon,
    disabled = false,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    accessibilityRole = 'button',
    className = '',
    screenReaderLabel,
    screenReaderHint,
    screenReaderPressAnnouncement,
    hideFromScreenReader,
    screenReaderOrder,
}: AppButtonProps) {

    const styles = variants[variant];
    const compact = size === 'compact';
    // Figma (7211 "Start conversation") draws a disabled yellow button as a grey outline; other variants dim.
    const figmaDisabled = disabled && variant === 'secondary';
    const baseText = figmaDisabled ? DISABLED.text : styles.text;
    const textClass = compact ? baseText.replace('text-[20px]', 'text-[18px] leading-[26px]') : baseText;
    const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

    return (
        <Pressable
            {...screenReaderProps}
            {...skipFocusProps(hideFromScreenReader)}
            ref={ref}
            onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
            disabled={disabled}
            accessibilityLabel={screenReaderLabel ?? accessibilityLabel ?? title}
            accessibilityRole={accessibilityRole}
            accessibilityHint={screenReaderHint ?? accessibilityHint}
            accessibilityState={disabled ? { ...accessibilityState, disabled: true } : accessibilityState}
            {...(Platform.OS === 'web' && {
                'aria-pressed': accessibilityState?.selected,
                'aria-expanded': accessibilityState?.expanded,
            })}
            className={`flex-row px-2 justify-center items-center active:opacity-70 ${compact ? 'min-h-[52px] gap-2 rounded-lg' : `gap-[10px] rounded-[4px] ${variant === 'subtle' ? 'min-h-12' : 'min-h-14'}`} ${figmaDisabled ? DISABLED.container : styles.container} ${disabled && !figmaDisabled ? 'opacity-40' : ''} ${className}`}
        >
            {icon && !SvgIcon && <Ionicons name={icon} size={24} color={styles.iconColor} accessibilityElementsHidden importantForAccessibility="no" />}
            {SvgIcon && <SvgIcon width={24} height={24} color={figmaDisabled ? DISABLED.iconColor : styles.iconColor} />}
            <Text className={`font-sans-bold text-center shrink ${textClass}`}>{title}</Text>
        </Pressable>
    );
}
