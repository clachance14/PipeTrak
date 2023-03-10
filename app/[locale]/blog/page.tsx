import { PostListItem } from '@blog/components/PostListItem';
import { getPosts } from '@blog/mdx/server';
import { getTranslations } from 'next-intl/server';

export default async function BlogPage() {
  const posts = await getPosts();
  const t = await getTranslations('blog');

  return (
    <div>
      <div className="mb-12 pt-8 text-center">
        <h1 className="mb-2 text-5xl font-bold">{t('pageTitle')}</h1>
        <p className="text-lg opacity-50">{t('pageDescription')}</p>
      </div>
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostListItem post={post} key={post.slug} />
        ))}
      </div>
    </div>
  );
}
