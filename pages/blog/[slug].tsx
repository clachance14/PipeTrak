import { BlogPostPage } from '@blog/client';
import { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ params }) => {
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
    },
  };
};

export const getStaticPaths = async () => {
  return {
    paths: [{ params: { slug: 'first-post' } }, { params: { slug: 'second-post' } }],
    fallback: false,
  };
};

export default BlogPostPage;
