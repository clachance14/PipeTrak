import BlogPageHeader from '@blog/components/PageHeader';
import { PostListItem } from '@blog/components/PostListItem';
import { allBlogPosts } from 'contentlayer/generated';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('blog');

  return {
    title: t('title'),
  };
}

export default async function BlogPage() {
  return (
    <div className="container max-w-5xl">
      <BlogPageHeader />
      <div className="grid gap-4 md:grid-cols-2">
        {allBlogPosts.map((post) => (
          <PostListItem post={post} key={post._id} />
        ))}
      </div>
    </div>
  );
}
