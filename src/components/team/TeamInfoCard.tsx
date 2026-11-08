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
        <View className="w-full px-4 py-8 bg-[#1F1F1F] border-y border-[#5C5C5C]">
            <TeamIcon name={name} />
            <Text
                accessibilityRole="header"
                className="text-center text-white text-[26px] leading-[34px] mt-5 font-sans-bold"
            >
                {name}
            </Text>
            <Text
                accessibilityLabel={`${season} season`}
                className="text-center text-line-subtle text-[18px] leading-[26px] mt-1 font-sans"
            >
                {season}
            </Text>
            {children}
        </View>
    );
}
