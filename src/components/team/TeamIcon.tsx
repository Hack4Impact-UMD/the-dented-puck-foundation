import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type TeamIconProps = ScreenReaderStopProps & {
    name: string;
    size?: number;
    // Initials size; defaults to 34% of `size` (Figma: 140 → 48). The 48px list avatar uses 18.
    textSize?: number;
};

// extract the initials for the team's initials
export function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// yellow circle icon (able to swap for profile picture in future)
// Hidden from screen readers by default: the team name beside it does the talking.
// With hideFromScreenReader={false} it's an image named "{name} logo".
export default function TeamIcon({
    name,
    size = 140,
    textSize,
    screenReaderLabel,
    hideFromScreenReader = true,
    screenReaderOrder,
}: TeamIconProps) {
    const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

    return (
        <View
            {...screenReaderProps}
            accessible={!hideFromScreenReader}
            accessibilityRole="image"
            accessibilityLabel={screenReaderLabel ?? `${name} logo`}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            className="bg-brand items-center justify-center self-center"
        >
            <Text
                aria-hidden
                importantForAccessibility="no"
                accessibilityElementsHidden
                maxFontSizeMultiplier={1}
                style={{ fontSize: textSize ?? Math.round(size * 0.34) }}
                className="text-on-brand font-sans-bold"
            >
                {getInitials(name)}
            </Text>
        </View>
    );
}
