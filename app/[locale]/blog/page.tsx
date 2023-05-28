import BlogPageHeader from '@blog/components/BlogPageHeader';
import { PostListItem } from '@blog/components/PostListItem';
import { getPosts } from '@blog/mdx/server';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('blog');

  return {
    title: t('title'),
  };
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div>
      <BlogPageHeader />
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostListItem post={post} key={post.slug} />
        ))}
      </div>
    </div>
  );
}
