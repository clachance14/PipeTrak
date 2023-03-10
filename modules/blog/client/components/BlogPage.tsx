import { BlogLayout } from '@blog/client/components/BlogLayout';
import { PostListItem } from '@blog/client/components/PostListItem';
import { BlogPost } from '@blog/types';

export function BlogPage({ posts }: { posts: BlogPost[] }) {
  const t = (key: string) => key; // TODO: useTranslation()

  return (
    <BlogLayout>
      <div className="mb-12 pt-8 text-center">
        <h1 className="mb-2 text-5xl font-bold">{t('pageTitle')}</h1>
        <p className="text-lg opacity-50">{t('pageDescription')}</p>
      </div>
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostListItem post={post} key={post.slug} />
        ))}
      </div>
    </BlogLayout>
  );
}
