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
  email: {
    from: 'kontakt@sedecon.tech',
    nodemailer: {
      host: process.env.MAIL_HOST as string,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER as string,
        pass: process.env.MAIL_PASSWORD as string,
      },
    },
  },
};

export type Locale = (typeof appConfig)['i18n']['locales'][number];

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export default appConfig;
