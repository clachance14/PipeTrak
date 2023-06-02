import { config as i18nConfig } from '@i18n/config';
import createIntlMiddleware from 'next-intl/middleware';

export default createIntlMiddleware({
  ...i18nConfig,
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
