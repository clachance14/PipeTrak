import createIntlMiddleware from 'next-intl/middleware';
import appConfig from './config';

export default createIntlMiddleware({
  ...appConfig.i18n,
});

export const config = {
  // Skip all paths that aren't pages that you'd like to internationalize
  matcher: ['/((?!api|_next|favicon.ico|assets).*)'],
};

// withAuth({
//   callbacks: {
//     authorized: ({ token }) => {
//       // you can access the user's token here and check for custom permissions or roles
//       return !!token;
//     },
//   },
//   pages: {
//     signIn: '/signin',
//   },

// })
