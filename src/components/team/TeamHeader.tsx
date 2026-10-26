import { Pressable, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AppButton from '@/components/team/AppButton';

type TeamHeaderProps = {
    onBack: () => void;
    onCreate: () => void;
};

// the top bar of the Team Info page
export default function TeamHeader({ onBack, onCreate }: TeamHeaderProps) {
    return (
        <View className="flex-row justify-between items-center w-full mt-5 px-2">
            <Pressable
                onPress={onBack}
                hitSlop={10}
                className="items-center justify-center active:opacity-70"
                accessibilityLabel="Back"
                accessibilityRole="button"
                accessibilityHint="Return to the previous screen"
            >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <AppButton
                title="Create"
                onPress={onCreate}
                variant="primary"
                accessibilityLabel="Create a team"
                accessibilityRole="link"
                accessibilityHint="Opens the create team screen"
            />
        </View>
    );
}
