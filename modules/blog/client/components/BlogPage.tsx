import { BlogLayout } from '@blog/client/components/BlogLayout';
import { BlogPost } from '@blog/types';
import Link from 'next/link';

export function BlogPage({ posts }: { posts: BlogPost[] }) {
  return (
    <BlogLayout>
      <ul>
        <li>
          <Link href="/blog/first-post">First post</Link>
        </li>
        <li>
          <Link href="/blog/second-post">Second post</Link>
        </li>
      </ul>
    </BlogLayout>
  );
}
