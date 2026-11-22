import { useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  formatEventDate,
  formatMonth,
  fromDateParam,
  toDateParam,
} from "@/components/events/eventFormat";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// The month's days padded with nulls so every week has 7 cells and day 1 lands on its weekday.
function getWeeks(month: Date) {
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = Array(month.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function NewEventDateScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const today = startOfToday();
  const [selected, setSelected] = useState(() =>
    date ? fromDateParam(date) : today,
  );
  const [month, setMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();

  function changeMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    AccessibilityInfo.announceForAccessibility(formatMonth(next));
  }

  return (
    <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-6">
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={isCurrentMonth}
          onPress={() => changeMonth(-1)}
          className="h-12 w-12 items-center justify-center active:opacity-70"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isCurrentMonth ? "#767676" : "#FFFFFF"}
          />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 text-center font-sans-bold text-[21px] leading-[30px] text-white"
        >
          {formatMonth(month)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => changeMonth(1)}
          className="h-12 w-12 items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View>
        {/* Each day button already says its weekday, so the letters are hidden from screen readers. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="flex-row"
        >
          {WEEKDAYS_SHORT.map((weekday) => (
            <Text
              key={weekday}
              className="h-8 flex-1 text-center font-sans-bold text-[16.5px] leading-8 text-[#C9C9C9]"
            >
              {weekday}
            </Text>
          ))}
        </View>
        {getWeeks(month).map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((day, dayIndex) => {
              if (!day)
                return <View key={dayIndex} className="h-[52px] flex-1" />;
              const isPast = day < today;
              const isToday = day.getTime() === today.getTime();
              const isSelected = day.getTime() === selected.getTime();
              const circle = isSelected
                ? "bg-brand"
                : isToday
                  ? "border-2 border-white"
                  : "";
              const text = isPast
                ? "font-sans text-line line-through"
                : isSelected
                  ? "font-sans-bold text-on-brand"
                  : isToday
                    ? "font-sans-bold text-white"
                    : "font-sans text-white";
              return (
                <View
                  key={dayIndex}
                  className="h-[52px] flex-1 items-center justify-center"
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${formatEventDate(day)}${isToday ? ", today" : ""}`}
                    accessibilityState={{ selected: isSelected }}
                    disabled={isPast}
                    onPress={() => setSelected(day)}
                    className={`h-12 w-12 items-center justify-center rounded-full ${circle}`}
                  >
                    <Text className={`text-lg ${text}`}>{day.getDate()}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <AuthButton
        label="Save Date"
        accessibilityLabel="Save date"
        onPress={() =>
          router.dismissTo({
            pathname: "/tabs/home/new-event",
            params: { date: toDateParam(selected) },
          })
        }
      />
    </ScrollView>
  );
}
