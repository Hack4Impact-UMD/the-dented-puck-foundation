import { Text, View } from 'react-native';

type TeamIconProps = {
    name: string;
    size?: number;
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

// yellow circle icon (able to swap for profile picture)
export default function TeamIcon({ name, size = 140 }: TeamIconProps) {
    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${name} logo`}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            className="bg-brand items-center justify-center self-center"
        >
            <Text
                maxFontSizeMultiplier={1}
                style={{ fontSize: Math.round(size * 0.34) }}
                className="text-on-brand font-sans-bold"
            >
                {getInitials(name)}
            </Text>
        </View>
    );
}
