import { BlogPage } from '@blog/client';
import { getPosts } from '@blog/server/mdx/posts';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    posts: await getPosts(),
    ...(await serverSideTranslations(locale!, ['common', 'blog'])),
  },
});

export default BlogPage;
