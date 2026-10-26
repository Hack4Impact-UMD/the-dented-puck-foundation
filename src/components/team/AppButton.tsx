import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Variant = 'primary' | 'secondary' | 'outline';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type AppButtonProps = {
    title: string,
    onPress: () => void;
    variant?: Variant;
    icon?: IconName;
    accessibilityLabel?: string;
    accessibilityValue?: { text: string };
    accessibilityRole?: 'button' | 'link';
    accessibilityHint?: string;
    className?: string
};

const variants: Record<Variant, { container: string; text: string, iconColor?: string }> = {
    primary:    { container: 'bg-transparent', text: 'text-[18px] text-white underline', iconColor: '#FFFFFF'},
    secondary:  { container: 'bg-brand', text: 'text-[20px] text-on-brand' },
    outline:    { container: 'border border-brand bg-brand-soft-dark', text: 'text-[20px] text-brand', iconColor: '#FFD101' },
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
    accessibilityValue,
    className = ''
}: AppButtonProps) {

    const styles = variants[variant];

    return (
        <Pressable
            onPress={onPress}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityValue={accessibilityValue}
            accessibilityRole={accessibilityRole}
            accessibilityHint={accessibilityHint}
            className={`flex-row gap-2 px-4 py-3 min-h-[44px] rounded-[2px] justify-center items-center active:opacity-70 ${styles.container} ${className}`}
        >
            {icon && <Ionicons name={icon} size={22} color={styles.iconColor} accessibilityElementsHidden importantForAccessibility="no" />}
            <Text className={`font-bold ${styles.text}`}>{title}</Text>
        </Pressable>
    )
}
