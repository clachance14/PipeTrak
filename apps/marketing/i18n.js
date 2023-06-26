module.exports = {
  locales: ["en", "de"],
  defaultLocale: "en",
  pages: {
    "*": ["common"],
    "/[lang]/blog": ["blog"],
    "/[lang]/blog/*": ["blog"],
  },
};
