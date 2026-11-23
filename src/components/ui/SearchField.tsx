import { TextInput, View, type TextInputProps } from 'react-native';
import SearchIcon from '@/assets/icons/search.svg';
import {
  screenReaderHiddenProps,
  skipFocusProps,
  useScreenReaderProps,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { PLACEHOLDER_COLOR } from './tokens';

type Props = ScreenReaderProps &
  Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
    /** Spoken name, for example "Search teams". Defaults to the placeholder. */
    label?: string;
    /** Read after the label. */
    hint?: string;
    /**
     * `filled`: grey box, no border (Home search).
     * `outlined`: 2 px white border (location search, New message "Search by name").
     */
    variant?: 'filled' | 'outlined';
  };

/** Text field with a magnifying-glass icon. Pass `TextInput` props (`value`, `onChangeText`, `placeholder`). */
export function SearchField({ label, hint, variant = 'outlined', hideFromScreenReader, screenReaderOrder, ...inputProps }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      className={`min-h-14 flex-row items-center gap-3 rounded bg-surface-field px-3.5 ${variant === 'outlined' ? 'border-2 border-white' : ''}`}
    >
      <View {...screenReaderHiddenProps(true)}>
        <SearchIcon width={24} height={24} />
      </View>
      <TextInput
        accessibilityLabel={label ?? inputProps.placeholder}
        accessibilityHint={hint}
        returnKeyType="search"
        placeholderTextColor={PLACEHOLDER_COLOR}
        {...skipFocusProps(hideFromScreenReader)}
        {...inputProps}
        className="min-h-12 flex-1 font-sans text-[18px] text-white"
      />
    </View>
  );
}
