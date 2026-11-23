import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import ChevronDownIcon from '@/assets/icons/chevron-down.svg';
import ChevronUpIcon from '@/assets/icons/chevron-up.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { colors } from './tokens';

export type SelectOption<T extends string> = { value: T; label: string };

export type SelectFieldScreenReaderParts = {
  /** The field button. Default label: "{label}, {value or placeholder}". */
  field?: ScreenReaderControlText;
};

type Props<T extends string> = ScreenReaderProps & {
  label: string;
  options: SelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  screenReaderParts?: SelectFieldScreenReaderParts;
};

/**
 * Labeled dropdown (Figma: Gender, Age range, Location). Closed it looks like a text field with
 * a chevron; open, the field turns black with a yellow outline and the options drop down in a
 * list that scrolls after five. Picking an option closes the list.
 */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select',
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props<T>) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const field = screenReaderParts?.field;
  const web = Platform.OS === 'web';

  return (
    <View {...screenReaderProps} className="gap-2">
      <Text aria-hidden className="font-sans-bold text-body text-white">
        {label}
      </Text>
      <View>
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(() => setOpen((isOpen) => !isOpen), field?.pressAnnouncement)}
          accessibilityRole="button"
          accessibilityLabel={field?.label ?? `${label}, ${selected?.label ?? placeholder}`}
          accessibilityHint={field?.hint}
          accessibilityState={{ expanded: open }}
          {...(web && { 'aria-expanded': open })}
          className={`min-h-14 flex-row items-center justify-between border-2 pl-4 pr-3 ${
            open ? 'rounded-t border-brand bg-black' : 'rounded border-white bg-surface-field'
          }`}
        >
          <Text className="font-sans text-[18px] text-white">{selected?.label ?? placeholder}</Text>
          {open ? <ChevronUpIcon width={24} height={24} color={colors.white} /> : <ChevronDownIcon width={24} height={24} color={colors.white} />}
        </Pressable>
        {open ? (
          <ScrollView
            nestedScrollEnabled
            style={{ maxHeight: 240 }}
            className="rounded-b border-x-2 border-b-2 border-brand bg-surface-raised"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  {...skipFocusProps(hideFromScreenReader)}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                  // aria-selected isn't allowed on a button; like AppButton, the web reads "pressed".
                  {...(web && { 'aria-pressed': isSelected })}
                  className={`min-h-12 justify-center px-4 active:opacity-70 ${
                    index < options.length - 1 ? 'border-b border-line-muted' : ''
                  } ${isSelected ? 'bg-brand-soft-dark' : ''}`}
                >
                  <Text className={`text-[18px] text-white ${isSelected ? 'font-sans-bold' : 'font-sans'}`}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
