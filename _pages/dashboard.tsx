import { DashboardPage } from '@dashboard/client';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale!, ['common', 'dashboard'])) },
});

export default DashboardPage;

// @ts-ignore
DashboardPage.auth = true;
