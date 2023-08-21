const lightVariables = {
  colors: {
    border: "hsl(214.3 31.8% 91.4%)",
    input: "hsl(214.3 31.8% 91.4%)",
    ring: "hsl(146 40% 57%)",
    background: "#ffffff",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: "hsl(146 40% 57%)",
    "primary-foreground": "#ffffff",
    secondary: "hsl(210 40% 96.1%)",
    "secondary-foreground": "hsl(222.2 47.4% 11.2%)",
    destructive: "hsl(0 84.2% 60.2%)",
    "destructive-foreground": "hsl(210 40% 98%)",
    muted: "hsl(210 40% 98.1%)",
    "muted-foreground": "hsl(215.4 16.3% 46.9%)",
    accent: "hsl(210 40% 96.1%)",
    "accent-foreground": "hsl(222.2 47.4% 11.2%)",
    popover: "#ffffff",
    "popover-foreground": "hsl(222.2 84% 4.9%)",
    card: "#ffffff",
    "card-foreground": "hsl(222.2 84% 4.9%)",
  },
};

const darkVariables = {
  colors: {
    border: "hsl(217.2 32.6% 20%)",
    input: "hsl(217.2 32.6% 17.5%)",
    ring: "hsl(146 43% 65%)",
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(146 43% 65%)",
    "primary-foreground": "hsl(146 27% 16%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    "secondary-foreground": "hsl(210 40% 98%)",
    destructive: "hsl(0 62.8% 30.6%)",
    "destructive-foreground": "hsl(210 40% 98%)",
    muted: "hsl(217.2 32.6% 10.5%)",
    "muted-foreground": "hsl(215 20.2% 65.1%)",
    accent: "hsl(217.2 32.6% 17.5%)",
    "accent-foreground": "hsl(210 40% 98%)",
    popover: "hsl(222.2 84% 4.9%)",
    "popover-foreground": "hsl(210 40% 98%)",
    card: "hsl(222.2 84% 4.9%)",
    "card-foreground": "hsl(210 40% 98%)",
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      borderRadius: {
        lg: `0.75rem`,
        md: `calc(0.75rem - 2px)`,
        sm: "calc(0.75rem - 4px)",
      },
      fontFamily: {
        // --font-sans is defined as a variable by next/font
        sans: ["var(--font-sans)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        border: "var(--colors-border)",
        input: "var(--colors-input)",
        ring: "var(--colors-ring)",
        background: "var(--colors-background)",
        foreground: "var(--colors-foreground)",
        primary: {
          DEFAULT: "var(--colors-primary)",
          foreground: "var(--colors-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--colors-secondary)",
          foreground: "var(--colors-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--colors-destructive)",
          foreground: "var(--colors-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--colors-muted)",
          foreground: "var(--colors-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--colors-accent)",
          foreground: "var(--colors-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--colors-popover)",
          foreground: "var(--colors-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--colors-card)",
          foreground: "var(--colors-card-foreground)",
        },
      },
    },
    variables: {
      DEFAULT: lightVariables,
    },
    darkVariables: {
      DEFAULT: darkVariables,
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "base",
    }),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
    require("tailwindcss-animate"),
    require("@mertasan/tailwindcss-variables"),
  ],
};
