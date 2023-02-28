import { BlogPostPage } from '@blog/client';
import { getPostBySlug, getPostSlugs } from '@blog/server/mdx';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { serialize } from 'next-mdx-remote/serialize';

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug;

  if (!slug)
    return {
      redirect: {
        destination: '/blog',
        permanent: false,
      },
    };

  const post = await getPostBySlug(slug as string);

  return {
    props: {
      post,
      mdxSource: post?.contentType === 'mdx' ? await serialize(post.content) : undefined,
      ...(await serverSideTranslations(locale!, ['common', 'blog'])),
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales, defaultLocale }) => {
  const postSlugs = await getPostSlugs();

  return {
    paths:
      locales
        ?.map((locale) => {
          const isDefaultLocale = locale === defaultLocale;
          return postSlugs.map((slug) => ({ params: { slug }, locale: isDefaultLocale ? undefined : locale }));
        })
        .flat() || [],
    fallback: false,
  };
};

export default BlogPostPage;
