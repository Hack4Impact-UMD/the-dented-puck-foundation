// Hex values for props that take a color instead of a class name: SVG icon `color`,
// `placeholderTextColor`, and the like. Keep in sync with tailwind.config.js.
export const colors = {
  brand: '#FFD101',
  black: '#010101',
  white: '#FFFFFF',
  inkSubtle: '#BDBDBD',
  inkQuiet: '#C9C9C9',
  inkMuted: '#B3B3B3',
  inkIcon: '#CFCFCF',
  danger: '#FF8A80',
  line: '#767676',
} as const;

/** Placeholder text in every text field (Figma uses #BDBDBD on the dark field). */
export const PLACEHOLDER_COLOR = colors.inkSubtle;
