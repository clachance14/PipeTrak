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

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default appConfig;
