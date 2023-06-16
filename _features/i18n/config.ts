export const config = {
  defaultLocale: 'en',
  locales: ['en'],
};

export type Locale = (typeof config)['locales'][number];
