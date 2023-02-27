module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  fallbackLng: {
    default: ['en'],
    nonExplicitSupportedLngs: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
