import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type TabName = 'home' | 'teams' | 'chats' | 'account';

// 24x24 line icons taken from the Figma nav bar.
const ICON_PATHS: Record<TabName, string[]> = {
  home: [
    'M3 9L12 2L21 9V18C21 18.265 20.895 18.52 20.707 18.707C20.52 18.895 20.265 19 20 19H15V13H9V19H4C3.735 19 3.481 18.895 3.293 18.707C3.106 18.52 3 18.265 3 18V9Z',
  ],
  teams: [
    'M12.5 6C12.5 7.933 10.933 9.5 9 9.5C7.067 9.5 5.5 7.933 5.5 6C5.5 4.067 7.067 2.5 9 2.5C10.933 2.5 12.5 4.067 12.5 6Z',
    'M2.5 18C2.5 14.4 5.4 12 9 12C12.6 12 15.5 14.4 15.5 18',
    'M16 2.6C16.761 2.786 17.438 3.222 17.922 3.839C18.406 4.455 18.669 5.216 18.669 6C18.669 6.784 18.406 7.545 17.922 8.161C17.438 8.778 16.761 9.214 16 9.4',
    'M18 12.3C20.1 13 21.5 15.1 21.5 18',
  ],
  chats: ['M4 3H20V14H9L4 18V3Z'],
  account: [
    'M16 6C16 8.209 14.209 10 12 10C9.791 10 8 8.209 8 6C8 3.791 9.791 2 12 2C14.209 2 16 3.791 16 6Z',
    'M4 19C4 14.6 7.6 12 12 12C16.4 12 20 14.6 20 19',
  ],
};

// SVG props can't take Tailwind classes, so these mirror the on-brand and white tokens.
const INK = '#010101';
const WHITE = '#FFFFFF';

interface TabBarIconProps {
  name: TabName;
  focused: boolean;
}

// Hidden from screen readers: the tab's label already names it.
export function TabBarIcon({ name, focused }: TabBarIconProps) {
  const stroke = focused ? INK : WHITE;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`h-8 w-14 items-center justify-center rounded-full pt-1 ${focused ? 'bg-brand' : ''}`}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        {ICON_PATHS[name].map((d) => (
          <Path
            key={d}
            d={d}
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}
