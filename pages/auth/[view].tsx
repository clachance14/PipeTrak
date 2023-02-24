import { AuthPage } from '@auth/client';
import { getAuthOptions } from '@auth/server';
import { AuthView } from '@auth/types';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const authViews: AuthView[] = ['signup', 'signin', 'forgot-password', 'reset-password'];

export const getServerSideProps: GetServerSideProps = async ({ req, res, locale, params, query }) => {
  const view = params?.view as string;

  if (!view || !authViews.includes(view as AuthView))
    return {
      redirect: {
        destination: '/',
        permanent: true,
      },
    };

  const session = await getServerSession(req, res, getAuthOptions(req));

  // if user is not logged in and tries to access reset-password page, redirect to signin page
  if (!session && view === 'reset-password')
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };

  // if user is logged in and tries to access any other auth page, redirect to home page
  if (session && view !== 'reset-password')
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common', 'auth'])),
      view,
    },
  };
};

const AuthActionPage = ({ view }: { view: AuthView }) => <AuthPage view={view} />;

export default AuthActionPage;
