export const appConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  blog: {
    contentPath: 'content/blog',
  },
  auth: {
    redirectAfterSignin: '/dashboard',
  },
};

export type Locale = (typeof appConfig)['i18n']['locales'][number];

export default appConfig;
