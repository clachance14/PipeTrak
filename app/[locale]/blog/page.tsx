import BlogPageHeader from '@blog/components/BlogPageHeader';
import { PostListItem } from '@blog/components/PostListItem';
import { getPosts } from '@blog/mdx/server';

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
