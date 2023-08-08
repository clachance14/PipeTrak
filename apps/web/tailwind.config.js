module.exports = {
  presets: [require("@supastarter/frontend/shared/tailwind")],
  content: [
    "./app/**/*.tsx",
    "./components/**/*.tsx",
    "../../packages/ui/**/*.tsx",
    "../../common/components/**/*.tsx",
    "../../packages/auth/client/base/components/**/*.tsx",
  ],
};
