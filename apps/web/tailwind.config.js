module.exports = {
  presets: [require("tailwind-config")],
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  plugins: [require("tailwindcss-animate")],
};
