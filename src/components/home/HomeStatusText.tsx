import { Platform, Text, type TextProps } from 'react-native';
import { useHomeAnnouncement } from '@/hooks/useHomeAnnouncement';

export function HomeStatusText({ children, delay, announceOnMount, ...props }: Omit<TextProps, 'children'> & {
  children: string; delay?: number; announceOnMount?: boolean;
}) {
  useHomeAnnouncement(props.accessibilityLabel ?? children, delay, announceOnMount);
  return <Text {...props} accessibilityLiveRegion={Platform.OS === 'web' ? 'polite' : undefined}
    role={Platform.OS === 'web' ? 'status' : undefined}>{children}</Text>;
}
