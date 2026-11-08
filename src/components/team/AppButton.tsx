import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Variant = 'primary' | 'secondary' | 'outline';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type AppButtonProps = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    icon?: IconName;
    accessibilityLabel?: string;
    accessibilityRole?: 'button';
    accessibilityHint?: string;
    className?: string;
};

const variants: Record<Variant, { container: string; text: string; iconColor?: string }> = {
    primary:    { container: 'bg-transparent', text: 'text-[18px] text-white underline', iconColor: '#FFFFFF'},
    secondary:  { container: 'bg-brand', text: 'text-[20px] text-on-brand' },
    outline:    { container: 'border-2 border-brand bg-brand-soft-dark', text: 'text-[20px] text-brand', iconColor: '#FFD101' },
};

// button component with varying styles
export default function AppButton({
    title,
    onPress,
    variant = 'primary',
    icon,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'button',
    className = ''
}: AppButtonProps) {

    const styles = variants[variant];

    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole={accessibilityRole}
            accessibilityHint={accessibilityHint}
            className={`flex-row gap-[10px] px-2 min-h-14 rounded-[4px] justify-center items-center active:opacity-70 ${styles.container} ${className}`}
        >
            {icon && <Ionicons name={icon} size={24} color={styles.iconColor} accessibilityElementsHidden importantForAccessibility="no" />}
            <Text className={`font-sans-bold text-center shrink ${styles.text}`}>{title}</Text>
        </Pressable>
    );
}
