import { useRef, useState } from 'react';
import { Platform, Text, TextInput, View, type AccessibilityActionEvent, type GestureResponderEvent, type KeyDownEvent } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  type ScreenReaderFieldText,
  type ScreenReaderProps,
} from '@/components/accessibility';

const THUMB = 28;

export type RangeSliderScreenReaderParts = {
  /** Low value box and thumb. Default label: "Minimum {label}". */
  low?: ScreenReaderFieldText;
  /** High value box and thumb. Default label: "Maximum {label}". */
  high?: ScreenReaderFieldText;
};

type Props = ScreenReaderProps & {
  /** Visible legend, for example "Age range". */
  label: string;
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** Lower-cased into the spoken names: "Minimum age", "Maximum age". Default: `label`. */
  valueName?: string;
  screenReaderParts?: RangeSliderScreenReaderParts;
};

const clamp = (value: number, lowest: number, highest: number) => Math.min(Math.max(value, lowest), highest);

/**
 * Two-thumb range slider with typed values (Figma 4510: Age range 0–99). The value boxes are
 * number fields (applied when the field loses focus or is submitted) and the thumbs are adjustable
 * (swipe up or down with VoiceOver or TalkBack; arrow keys, Page Up/Down, Home and End on the
 * web), so the range can be set without dragging. The outline turns yellow while a thumb is held.
 */
export function RangeSlider({
  label,
  min,
  max,
  low,
  high,
  onChange,
  valueName = label,
  screenReaderParts,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  // What's typed in each value box until it's applied; may be empty or out of range meanwhile.
  const [drafts, setDrafts] = useState<Partial<Record<'low' | 'high', string>>>({});
  // Where the current drag started; written only by the touch handlers below.
  const dragStart = useRef<{ pageX: number; value: number } | null>(null);
  const name = valueName.toLowerCase();

  const set = (which: 'low' | 'high', value: number) => {
    const next = Math.round(value);
    if (which === 'low') onChange(clamp(next, min, high), high);
    else onChange(low, clamp(next, low, max));
  };

  const touchHandlers = (which: 'low' | 'high') => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      dragStart.current = { pageX: event.nativeEvent.pageX, value: which === 'low' ? low : high };
      setDragging(true);
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const start = dragStart.current;
      if (!start) return;
      set(which, start.value + ((event.nativeEvent.pageX - start.pageX) / (trackWidth || 1)) * (max - min));
    },
    onResponderRelease: () => {
      dragStart.current = null;
      setDragging(false);
    },
    onResponderTerminate: () => {
      dragStart.current = null;
      setDragging(false);
    },
  });

  // Positions are percentages of the track (inset by half a thumb), so the first render is right
  // before onLayout reports a width; the width is only needed to turn a drag distance into a value.
  const pct = (value: number) => ((value - min) / (max - min || 1)) * 100;
  const adjust = (which: 'low' | 'high') => (event: AccessibilityActionEvent) => {
    const current = which === 'low' ? low : high;
    set(which, current + (event.nativeEvent.actionName === 'increment' ? 1 : -1));
  };

  // Web slider keys (WAI-ARIA slider pattern).
  const onThumbKeyDown = (which: 'low' | 'high') => (event: KeyDownEvent) => {
    const current = which === 'low' ? low : high;
    const next: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      PageUp: current + 10,
      PageDown: current - 10,
      Home: min,
      End: max,
    };
    const value = next[event.nativeEvent.key];
    if (value === undefined) return;
    event.preventDefault();
    set(which, value);
  };

  const commit = (which: 'low' | 'high') => {
    const draft = drafts[which];
    if (draft === undefined) return;
    setDrafts((current) => ({ ...current, [which]: undefined }));
    const parsed = parseInt(draft, 10);
    // An empty box goes back to the current value; anything else is clamped by `set`.
    if (!Number.isNaN(parsed)) set(which, parsed);
  };

  const valueBox = (which: 'low' | 'high') => {
    const spoken = screenReaderParts?.[which];
    const value = which === 'low' ? low : high;
    return (
      <TextInput
        {...skipFocusProps(hideFromScreenReader)}
        value={drafts[which] ?? String(value)}
        onChangeText={(text) => setDrafts((current) => ({ ...current, [which]: text.replace(/\D/g, '') }))}
        onBlur={() => commit(which)}
        onSubmitEditing={() => commit(which)}
        keyboardType="number-pad"
        maxLength={String(max).length}
        accessibilityLabel={spoken?.label ?? `${which === 'low' ? 'Minimum' : 'Maximum'} ${name}`}
        accessibilityHint={spoken?.hint}
        className="h-12 w-16 rounded border border-white bg-black text-center font-sans-bold text-[18px] text-white"
      />
    );
  };

  const thumb = (which: 'low' | 'high') => {
    const value = which === 'low' ? low : high;
    const spoken = screenReaderParts?.[which];
    return (
      <View
        {...touchHandlers(which)}
        {...(Platform.OS === 'web' && {
          'aria-valuemin': min,
          'aria-valuemax': max,
          'aria-valuenow': value,
          tabIndex: 0 as const,
          onKeyDown: onThumbKeyDown(which),
        })}
        {...skipFocusProps(hideFromScreenReader)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${spoken?.label ?? `${which === 'low' ? 'Minimum' : 'Maximum'} ${name}`} slider`}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={adjust(which)}
        hitSlop={10}
        style={{ left: `${pct(value)}%`, marginLeft: -THUMB / 2 }}
        className="absolute top-2.5 h-7 w-7 rounded-full border-[3px] border-brand bg-white"
      />
    );
  };

  return (
    <View {...screenReaderProps} className="gap-2">
      <Text accessibilityRole="header" className="font-sans-bold text-body text-white">
        {label}
      </Text>
      <View className={`rounded border-2 bg-surface-field p-4 ${dragging ? 'border-brand' : 'border-white'}`}>
        <View className="flex-row justify-between">
          {valueBox('low')}
          {valueBox('high')}
        </View>
        <View className="h-12">
          <View className="absolute left-3.5 right-3.5 top-[21px] h-1.5 rounded-[3px] bg-line-dark" />
          <View
            className="absolute bottom-0 left-3.5 right-3.5 top-0"
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <View
              style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }}
              className="absolute top-[21px] h-1.5 bg-brand"
            />
            {thumb('low')}
            {thumb('high')}
          </View>
        </View>
        <View aria-hidden className="flex-row justify-between">
          <Text className="font-sans text-body text-ink-subtle">{min}</Text>
          <Text className="font-sans text-body text-ink-subtle">{max}</Text>
        </View>
      </View>
    </View>
  );
}
