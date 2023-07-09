module.exports = {
  presets: [require("tailwind-config")],
  content: [
    "./app/**/*.tsx",
    "./components/**/*.tsx",
    "../../packages/ui/**/*.tsx",
    "../../common/components/**/*.tsx",
  ],
};
