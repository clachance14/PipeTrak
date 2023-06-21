module.exports = {
  locales: ["en", "de"],
  defaultLocale: "en",
  defaultNS: "common",
  pages: {
    "*": ["common"],
    "/[lang]/auth": ["auth"],
    "/[lang]/auth/[view]": ["auth"],
  },
};
