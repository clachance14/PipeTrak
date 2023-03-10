import { AccountPage } from '@auth/client/';
import { getAuthOptions } from '@auth/server';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({ req, res, locale }) => {
  const session = await getServerSession(req, res, getAuthOptions(req));

  if (!session)
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };

  const { user } = session;

  return {
    props: { ...(await serverSideTranslations(locale!, ['common', 'auth'])), user },
  };
};

export default AccountPage;
