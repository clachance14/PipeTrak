import { BlogLayout } from '@blog/client/components/BlogLayout';
import Link from 'next/link';

interface Props {
  title: string;
}

export function BlogPostPage(props: Props) {
  return (
    <BlogLayout>
      <Link href="/blog">Back to blog</Link>
      <h1>{props.title}</h1>
    </BlogLayout>
  );
}
