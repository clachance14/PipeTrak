module.exports = {
  presets: [require("tailwind-config")],
  content: [
    "./app/**/*.tsx",
    "./components/**/*.tsx",
    "../../packages/ui/components/**/*.tsx",
    "../../packages/auth/ui/components/**/*.tsx",
  ],
};
