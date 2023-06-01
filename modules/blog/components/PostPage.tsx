import { mdxComponents } from '@blog/utils/mdx-components';
import { BlogPost } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer/hooks';
import { useFormatter } from 'next-intl';
import Link from 'next-intl/link';
import Image from 'next/image';

export default function PostPage({ post }: { post: BlogPost }) {
  const format = useFormatter();
  const { title, date, authorName, authorImage, tags, image, url, body } = post;
  const MDXContent = useMDXComponent(body.code);

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8">
        <Link href="/blog">&larr; Back to blog</Link>
      </div>

      <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{title}</h1>

      <div className="mt-4 flex items-center  justify-start gap-6">
        {authorName && (
          <div className="flex items-center">
            {authorImage && (
              <div className="relative mr-2 h-8 w-8 overflow-hidden rounded-full">
                <Image src={authorImage} alt={authorName} fill sizes="96px" className="object-cover object-center" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold opacity-50">{authorName}</p>
            </div>
          </div>
        )}

        <div className="ml-auto mr-0">
          <p className="text-sm opacity-30">{format.dateTime(new Date(date))}</p>
        </div>

        {tags && (
          <div className="flex flex-1 flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {image && (
        <div className="relative -mx-4 mt-6 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center"
          />
          <Link href={url} className="absolute inset-0" />
        </div>
      )}

      <div className="prose prose-zinc mt-6 dark:prose-invert">
        <MDXContent components={mdxComponents} />
      </div>
    </div>
  );
}
