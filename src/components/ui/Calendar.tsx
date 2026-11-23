import { Pressable, Text, View } from 'react-native';
import ChevronBackIcon from '@/assets/icons/chevron-back.svg';
import ChevronForwardIcon from '@/assets/icons/chevron-forward.svg';
import {
  screenReaderHiddenProps,
  skipFocusProps,
  useScreenReaderProps,
  type ScreenReaderProps,
} from '@/components/accessibility';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

type Props = ScreenReaderProps & {
  /** Any date in the month to show. */
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: Date;
  onSelect: (date: Date) => void;
  /** Days before this are crossed out and can't be picked. Default: today. Pass `null` to allow any day. */
  minDate?: Date | null;
  /** Ringed in white. Default: now. */
  today?: Date;
};

/**
 * Month grid (Figma 6510). Past days are crossed out, today has a white ring and the chosen
 * day is solid yellow. Each day is a button read as "Saturday, November 21"; the previous-month
 * button is disabled when the whole month before is in the past.
 */
export function Calendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  minDate,
  today = new Date(),
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const earliest = minDate === null ? null : startOfDay(minDate ?? today);
  const canGoBack = earliest === null || new Date(year, monthIndex, 0) >= earliest;

  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const nav = (delta: number) => onMonthChange(new Date(year, monthIndex + delta, 1));
  const monthLabel = (offset: number) => MONTHS[(monthIndex + offset + 12) % 12];

  return (
    <View {...screenReaderProps} className="gap-6">
      <View className="flex-row items-center">
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={() => nav(-1)}
          disabled={!canGoBack}
          accessibilityRole="button"
          accessibilityLabel={`Previous month, ${monthLabel(-1)}`}
          accessibilityState={{ disabled: !canGoBack }}
          className={`h-12 w-12 items-center justify-center ${canGoBack ? 'active:opacity-70' : 'opacity-40'}`}
        >
          <ChevronBackIcon width={24} height={24} />
        </Pressable>
        <Text accessibilityRole="header" className="flex-1 text-center font-sans-bold text-h3 text-white">
          {MONTHS[monthIndex]} {year}
        </Text>
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={() => nav(1)}
          accessibilityRole="button"
          accessibilityLabel={`Next month, ${monthLabel(1)}`}
          className="h-12 w-12 items-center justify-center active:opacity-70"
        >
          <ChevronForwardIcon width={24} height={24} />
        </Pressable>
      </View>

      <View>
        <View {...screenReaderHiddenProps(true)} className="flex-row">
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} className="h-8 flex-1 items-center justify-center">
              <Text className="font-sans-bold text-small text-ink-quiet">{weekday.slice(0, 3)}</Text>
            </View>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={w} className="flex-row">
            {week.map((date, d) => {
              if (!date) return <View key={d} className="h-[52px] flex-1" />;
              const past = earliest !== null && date < earliest;
              const isSelected = selected ? sameDay(date, selected) : false;
              const isToday = sameDay(date, today);
              const spoken = `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}${isToday ? ', today' : ''}`;
              return (
                <View key={d} className="h-[52px] flex-1 items-center justify-center">
                  <Pressable
                    {...skipFocusProps(hideFromScreenReader)}
                    onPress={() => onSelect(date)}
                    disabled={past}
                    accessibilityRole="button"
                    accessibilityLabel={spoken}
                    accessibilityState={{ selected: isSelected, disabled: past }}
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      isSelected ? 'border-2 border-black bg-brand' : isToday ? 'border-2 border-white' : ''
                    } ${past ? '' : 'active:opacity-70'}`}
                  >
                    <Text
                      className={`text-body ${
                        isSelected
                          ? 'font-sans-bold text-on-brand'
                          : past
                            ? 'font-sans text-line line-through'
                            : isToday
                              ? 'font-sans-bold text-white'
                              : 'font-sans text-white'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
