import React from 'react';
import { Text, View } from 'react-native';
import TeamIcon from '@/components/team/TeamIcon';
import {
    useScreenReaderProps,
    type ScreenReaderProps,
    type ScreenReaderStopText,
} from '@/components/accessibility';

/** Spoken text for each stop in a `TeamInfoCard`. */
export type TeamInfoCardScreenReaderParts = {
    /** The team name heading. Defaults to `name`. */
    name?: ScreenReaderStopText;
    /** The season line. Default: "{season} season". */
    season?: ScreenReaderStopText;
};

type TeamInfoCardProps = ScreenReaderProps & {
    name: string;
    season: string;
    children?: React.ReactNode;
    screenReaderParts?: TeamInfoCardScreenReaderParts;
};

// gray box with the Team Info inside: profile picture, team name, and season
export default function TeamInfoCard({
    name,
    season,
    children,
    screenReaderParts,
    hideFromScreenReader,
    screenReaderOrder,
}: TeamInfoCardProps) {
    const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

    return (
        <View {...screenReaderProps} className="w-full px-4 py-8 bg-surface-raised border-y border-line-dark">
            <TeamIcon name={name} />
            <Text
                accessibilityRole="header"
                accessibilityLabel={screenReaderParts?.name?.label}
                className="text-center text-white text-[26px] leading-[34px] mt-5 font-sans-bold"
            >
                {name}
            </Text>
            <Text
                accessibilityLabel={screenReaderParts?.season?.label ?? `${season} season`}
                className="text-center text-ink-soft text-body mt-1 font-sans"
            >
                {season}
            </Text>
            {children}
        </View>
    );
}
