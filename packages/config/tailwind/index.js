/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "100%",
        md: "100%",
        lg: "100%",
        xl: "100%",
        "2xl": "72rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--gradient-color-stops))",
      },
      colors: {
        primary: {
          // 50: "#fefdfa",
          // 100: "#fefcfa",
          // 200: "#fcf2e8",
          // 300: "#f6d6b7",
          // 400: "#eebc86",
          // 500: "#e9aa63",
          // 600: "#e0a052",
          // 700: "#d89031",
          // 800: "#bb8130",
          // 900: "#9e712e",
          // 950: "#6f4f1b",
          50: "#eef0ff",
          100: "#e0e3ff",
          200: "#c7cbfe",
          300: "#a5a9fc",
          400: "#8581f8",
          500: "#7263f1",
          600: "#6346e5",
          700: "#5638ca",
          800: "#4630a3",
          900: "#342871",
          950: "#241b4b",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "base",
    }),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
