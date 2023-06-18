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
        "2xl": "64rem",
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
          50: "#eff6ff",
          100: "#dceafd",
          200: "#c1dafc",
          300: "#96c4fa",
          400: "#64a4f6",
          500: "#3f81f2",
          600: "#1f5be5",
          700: "#214ed4",
          800: "#2141ac",
          900: "#213a87",
          950: "#182553",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "base",
    }),
    require("@tailwindcss/typography"),
  ],
};
