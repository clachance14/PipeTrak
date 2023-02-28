/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './modules/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        md: '640px',
        lg: '1024px',
        xl: '1024px',
        '2xl': '1024px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        serif: ['var(--font-manrope)', 'serif'],
      },
      colors: {
        primary: {
          50: '#ecedff',
          100: '#dddfff',
          200: '#c1c3ff',
          300: '#9c9cff',
          400: '#8275ff',
          500: '#7255ff',
          600: '#6536f5',
          700: '#5829d9',
          800: '#4724af',
          900: '#36227c',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'base',
    }),
    require('@tailwindcss/typography'),
  ],
};
