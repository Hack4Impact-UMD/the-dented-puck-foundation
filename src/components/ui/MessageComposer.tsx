import { TextInput, View } from 'react-native';
import PlusIcon from '@/assets/icons/plus.svg';
import {
  skipFocusProps,
  useScreenReaderProps,
  type ScreenReaderControlText,
  type ScreenReaderFieldText,
  type ScreenReaderProps,
} from '@/components/accessibility';
import { IconButton } from './IconButton';
import { PLACEHOLDER_COLOR } from './tokens';

export type MessageComposerScreenReaderParts = {
  /** The "+" button. Default label: "Add photo or file". */
  attach?: ScreenReaderControlText;
  /** The text field. Default label: the placeholder. */
  input?: ScreenReaderFieldText;
};

type Props = ScreenReaderProps & {
  value: string;
  onChangeText: (text: string) => void;
  /** Sent with the keyboard's Send key. */
  onSend: () => void;
  /** Shows the "+" button. */
  onAttach?: () => void;
  /** For example "Message Jordan P." or "Message #team". */
  placeholder: string;
  screenReaderParts?: MessageComposerScreenReaderParts;
};

/** Bottom bar of a conversation: "+" attach button and the message field (Figma 7220, 7300). */
export function MessageComposer({
  value,
  onChangeText,
  onSend,
  onAttach,
  placeholder,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const attach = screenReaderParts?.attach;

  return (
    <View {...screenReaderProps} className="flex-row items-center gap-2 border-t border-line-faint bg-black px-4 pb-7 pt-3">
      {onAttach ? (
        <IconButton
          icon={PlusIcon}
          label="Add photo or file"
          variant="outlined"
          onPress={onAttach}
          screenReaderLabel={attach?.label}
          screenReaderHint={attach?.hint}
          screenReaderPressAnnouncement={attach?.pressAnnouncement}
          hideFromScreenReader={hideFromScreenReader}
        />
      ) : null}
      <TextInput
        {...skipFocusProps(hideFromScreenReader)}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR}
        returnKeyType="send"
        accessibilityLabel={screenReaderParts?.input?.label ?? placeholder}
        accessibilityHint={screenReaderParts?.input?.hint}
        className="min-h-[52px] flex-1 rounded-lg border-2 border-line bg-surface-alt-dark px-3.5 font-sans text-[18px] text-white"
      />
    </View>
  );
}
