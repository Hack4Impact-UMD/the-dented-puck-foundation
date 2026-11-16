import { type ComponentRef, useEffect, useRef } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

type Option = { value: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string[];
  multiple: boolean; // true: pick any (Filter, checkboxes); false: pick one (Sort, radio buttons)
  onChange: (selected: string[]) => void;
  onClose: () => void;
  onDismiss?: () => void; // after the sheet has closed
};

// Bottom sheet for Filter and Sort. The design has no open-state frame, so this is a plain list.
// iOS has no checkbox or radio role, so options are buttons marked selected; Android gets the real roles.
const CLEAR = 'Clear filters';

export function OptionSheet({ visible, title, options, selected, multiple, onChange, onClose, onDismiss }: Props) {
  const android = Platform.OS === 'android';

  // When the sheet opens, move the screen reader onto its title. Otherwise focus can stay on the
  // screen behind it and the options are never read.
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const focusTitle = () => {
    if (Platform.OS !== 'web' && titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
  };

  // Modal's onDismiss only fires on iOS, so on Android call it when the sheet goes from open to closed.
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (android && wasVisible.current && !visible) onDismiss?.();
    wasVisible.current = visible;
  }, [android, visible, onDismiss]);

  const toggle = (value: string) => {
    if (!multiple) return onChange([value]);
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={focusTitle}
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View accessibilityViewIsModal className="max-h-[75%] gap-2 rounded-t-lg bg-surface-alt-dark p-4 pb-8">
          <Text ref={titleRef} accessibilityRole="header" className="font-sans-bold text-xl text-white">
            {title}
          </Text>

          <ScrollView>
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => toggle(option.value)}
                  accessibilityRole={android ? (multiple ? 'checkbox' : 'radio') : 'button'}
                  accessibilityLabel={option.label}
                  accessibilityState={android ? { checked: isSelected } : { selected: isSelected }}
                  className="min-h-12 flex-row items-center justify-between gap-3 border-b border-line-dark active:opacity-70"
                >
                  <Text className="shrink font-sans text-lg text-white">{option.label}</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color="#FFD101"
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="flex-row gap-3 pt-2">
            {multiple && selected.length > 0 && (
              <Pressable
                onPress={() => onChange([])}
                accessibilityRole="button"
                accessibilityLabel={CLEAR}
                className="min-h-14 flex-1 items-center justify-center rounded border-2 border-brand bg-brand-soft-dark active:opacity-70"
              >
                <Text className="font-sans-bold text-lg text-brand">{CLEAR}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
              className="min-h-14 flex-1 items-center justify-center rounded bg-brand active:opacity-70"
            >
              <Text className="font-sans-bold text-lg text-on-brand">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
