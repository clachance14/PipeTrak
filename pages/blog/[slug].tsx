import { BlogPostPage } from '@blog/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug;

  if (!slug)
    return {
      redirect: {
        destination: '/blog',
        permanent: false,
      },
    };

  return {
    props: {
      title: slug,
      ...(await serverSideTranslations(locale!, ['common', 'blog'])),
    },
  };
};

const demoPosts = ['first-post', 'second-post'];

export const getStaticPaths: GetStaticPaths = async ({ locales, defaultLocale }) => {
  return {
    paths:
      locales
        ?.map((locale) => {
          const isDefaultLocale = locale === defaultLocale;
          return demoPosts.map((slug) => ({ params: { slug }, locale: isDefaultLocale ? undefined : locale }));
        })
        .flat() || [],
    fallback: false,
  };
};

export default BlogPostPage;
