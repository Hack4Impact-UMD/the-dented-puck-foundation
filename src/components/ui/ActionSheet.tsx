import type { ComponentType } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@/components/team/AppButton';
import {
  screenReaderHiddenProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { colors } from './tokens';

export type ActionSheetAction = {
  key: string;
  label: string;
  icon?: ComponentType<SvgProps>;
  onPress: () => void;
  /** Spoken text for this action. Defaults to `label`. */
  screenReader?: ScreenReaderControlText;
};

type Props = ScreenReaderProps & {
  visible: boolean;
  title: string;
  actions: ActionSheetAction[];
  /** Called by Cancel, a tap on the dimmed backdrop, and the Android back button. */
  onClose: () => void;
  cancelLabel?: string;
};

/**
 * Bottom sheet with a list of actions and a Cancel button (Figma 2210: "Profile photo" →
 * Take photo / Choose from library). Opens as a modal, so screen readers stay inside it.
 */
export function ActionSheet({ visible, title, actions, onClose, cancelLabel = 'Cancel', hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          {...screenReaderHiddenProps(true)}
          onPress={onClose}
          className="absolute inset-0 bg-black/70"
        />
        <View
          {...screenReaderProps}
          accessibilityViewIsModal
          style={{ paddingBottom: Math.max(insets.bottom, 40) }}
          className="rounded-t-2xl border-t border-line-dark bg-surface-raised px-4 pt-2.5"
        >
          <View {...screenReaderHiddenProps(true)} className="items-center">
            <View className="h-[5px] w-10 rounded-[3px] bg-line-strong" />
          </View>
          <Text accessibilityRole="header" className="pb-2 pt-3.5 text-center font-sans-bold text-body text-ink-soft">
            {title}
          </Text>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.key}
                onPress={withPressAnnouncement(action.onPress, action.screenReader?.pressAnnouncement)}
                accessibilityRole="button"
                accessibilityLabel={action.screenReader?.label ?? action.label}
                accessibilityHint={action.screenReader?.hint}
                className={`h-16 flex-row items-center gap-4 pl-2 active:opacity-70 ${
                  index < actions.length - 1 ? 'border-b border-line-dark' : ''
                }`}
              >
                {Icon ? <Icon width={24} height={24} color={colors.brand} /> : null}
                <Text className="font-sans text-body text-white">{action.label}</Text>
              </Pressable>
            );
          })}
          <View className="pt-4">
            <AppButton title={cancelLabel} onPress={onClose} variant="outline" className="w-full" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
