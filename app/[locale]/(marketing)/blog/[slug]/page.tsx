import PostPage from '@blog/components/PostPage';
import { allBlogPosts } from 'contentlayer/generated';
import { getTranslations, redirect } from 'next-intl/server';

// export async function generateStaticParams() {
//   const slugs = await getPostSlugs();
//   const locales = appConfig.i18n.locales;

//   return locales
//     .map((locale) =>
//       slugs.map((slug) => ({
//         slug,
//         locale,
//       }))
//     )
//     .flat();
// }

interface Params {
  slug: string;
  locale: string;
}

export async function generateMetadata({ params: { slug } }: { params: Params }) {
  const post = allBlogPosts.find((post) => post.slug === slug);
  const t = await getTranslations('blog');

  return {
    title: `${post?.title} | ${t('title')}`,
  };
}

export default async function BlogPostPage({ params: { slug } }: { params: Params }) {
  const post = allBlogPosts.find((post) => post.slug === slug);

  if (!post) {
    redirect('/blog');
  }

  return <PostPage post={post} />;
}
