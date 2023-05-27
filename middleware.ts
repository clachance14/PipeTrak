import createIntlMiddleware from 'next-intl/middleware';
import appConfig from './config';

export default createIntlMiddleware({
  ...appConfig.i18n,
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
