/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
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
        },
        ink: {
          DEFAULT: '#010101',
          dark: '#FFFFFF',
          muted: {
            DEFAULT: '#4A4A4A',
            dark: '#B3B3B3',
          },
        },
        line: {
          DEFAULT: '#767676',
          subtle: '#D9D9D9',
        },
        danger: {
          DEFAULT: '#B3261E',
          dark: '#FF8A80',
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
