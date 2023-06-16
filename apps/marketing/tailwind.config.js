const sharedConfig = require("tailwind");

module.exports = {
  presets: [sharedConfig],
  content: [
    "./app/**/*.tsx",
    "./components/**/*.tsx",
    "../../packages/ui/**/*.tsx",
  ],
};
