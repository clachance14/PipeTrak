import { BlogPost } from '@blog/types';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Link from 'next/link';
import { BlogLayout } from './BlogLayout';

interface Props {
  post: BlogPost;
  mdxSource?: MDXRemoteSerializeResult;
}

export function BlogPostPage({ post, mdxSource }: Props) {
  return (
    <BlogLayout>
      <Link href="/blog">Back to blog</Link>
      <h1>{post.title}</h1>

      <div className="prose prose-zinc dark:prose-invert">
        {post.contentType === 'mdx' && mdxSource ? (
          <MDXRemote {...mdxSource} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
        )}
      </div>
    </BlogLayout>
  );
}
