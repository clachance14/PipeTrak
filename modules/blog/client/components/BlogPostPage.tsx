import { mdxComponents } from '@blog/client/lib/mdx';
import { BlogPost } from '@blog/types';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BlogLayout } from './BlogLayout';

interface Props {
  post: BlogPost;
  mdxSource?: MDXRemoteSerializeResult;
}

export function BlogPostPage({ post, mdxSource }: Props) {
  const { locale } = useRouter();
  const { title, contentType, content, excerpt, author, slug, createdAt, tags } = post;

  const formattedDate = new Date(createdAt).toLocaleDateString(locale);

  return (
    <BlogLayout>
      <div className="mb-8">
        <Link href="/blog">&larr; Back to blog</Link>
      </div>

      <div className="mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{title}</h1>

        <div className="mt-4 flex items-center  justify-start gap-6">
          {author && (
            <div className="flex items-center">
              {author.image && (
                <div className="relative mr-2 h-8 w-8 overflow-hidden rounded-full">
                  <Image src={author.image} alt={author.name} fill className="object-cover object-center" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold opacity-50">{author.name}</p>
              </div>
            </div>
          )}

          <p className="text-sm opacity-30">{formattedDate}</p>

          {tags && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert">
        {contentType === 'mdx' && mdxSource ? (
          <MDXRemote {...mdxSource} components={mdxComponents} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }}></div>
        )}
      </div>
    </BlogLayout>
  );
}
