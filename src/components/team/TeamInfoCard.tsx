import React from 'react';
import { Text, View } from 'react-native';
import TeamIcon from '@/components/team/TeamIcon';

type TeamInfoCardProps = {
    name: string;
    season: string;
    children?: React.ReactNode;
};

// gray box with the Team Info inside: profile picture, team name, and season
export default function TeamInfoCard({ name, season, children }: TeamInfoCardProps) {
    return (
        <View className="w-full mt-2 px-4 py-8 bg-surface-alt-dark border-y border-line">
            <TeamIcon name={name} />
            <Text
                accessibilityRole="header"
                className="text-center text-white text-[26px] mt-6 font-bold"
            >
                {name}
            </Text>
            <Text
                accessibilityLabel={`${season} season`}
                className="text-center text-line-subtle text-[18px] mt-1"
            >
                {season}
            </Text>
            {children}
        </View>
    );
}
