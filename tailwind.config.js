/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['AtkinsonHyperlegible_400Regular'],
        'sans-bold': ['AtkinsonHyperlegible_700Bold'],
      },
      // Type scale from the Figma Style Guide ("Fonts/Text Sizes"). Nothing goes below `small` (16.5px).
      // Weight comes from font-sans / font-sans-bold, color from the ink tokens.
      fontSize: {
        display: ['40px', { lineHeight: '48px' }],
        h1: ['32px', { lineHeight: '40px' }],
        h2: ['26px', { lineHeight: '34px' }],
        h3: ['21px', { lineHeight: '30px' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        body: ['18px', { lineHeight: '26px' }],
        label: ['18px', { lineHeight: '24px' }],
        caption: ['18px', { lineHeight: '24px' }],
        small: ['16.5px', { lineHeight: '24px' }],
      },
      colors: {
        brand: {
          DEFAULT: '#FFD101',
          soft: {
            DEFAULT: '#FFF6CC',
            dark: '#2B2400',
          },
        },
        black: '#010101',
        white: '#FFFFFF',
        'on-brand': '#010101',
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#010101',
          alt: {
            DEFAULT: '#F2F2F2',
            dark: '#1C1C1C',
          },
          field: '#2D2E2F',
          // Dark surfaces used by the hi-fi screens (not in the Style Guide palette).
          card: '#2E2E2E', // date tile, RSVP options, coach note, Following button
          raised: '#1F1F1F', // team info card (Figma color/grey/12)
          well: '#262626', // verify-email address box (Figma color/grey/15)
        },
        ink: {
          DEFAULT: '#010101',
          dark: '#FFFFFF',
          muted: {
            DEFAULT: '#4A4A4A',
            dark: '#B3B3B3',
          },
          subtle: '#BDBDBD',
          soft: '#D9D9D9', // secondary text on team, invite, request-sent and verify-email screens (color/grey/85)
          quiet: '#C9C9C9', // secondary text on event screens: address, note label, Requested
          icon: '#CFCFCF', // empty profile-photo icon
        },
        line: {
          DEFAULT: '#767676',
          subtle: '#D9D9D9',
          dark: '#5C5C5C',
          faint: '#2B2B2B', // chat dividers and borders (color/grey/17)
          muted: '#3D3D3D', // dropdown option dividers (color/grey/24)
          track: '#6B6B6B', // unfinished step in StepProgress (color/grey/42)
          strong: '#8C8C8C', // dashed photo outline, sheet handle (color/grey/55)
          'switch-off': '#C6CACE', // Switch track when off (gray-cool-20)
        },
        danger: {
          DEFAULT: '#B3261E',
          dark: '#FF8A80',
          soft: '#2A1210', // AlertBanner background (color/red/11)
        },
        success: {
          DEFAULT: '#1B6E35',
          dark: '#7CD992',
        },
        info: {
          DEFAULT: '#0B57D0',
          dark: '#9DBBFF',
        },
      },
    },
  },
  plugins: [],
};
