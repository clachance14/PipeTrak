import { mdxComponents } from '@blog/mdx/client';
import { getPostBySlug } from '@blog/mdx/server';
import Link from 'next-intl/link';
import { redirect } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { Suspense } from 'react';

// export async function generateStaticParams() {
//   const slugs = await getPostSlugs();
//   const locales = appConfig.i18n.locales;

//   return locales
//     .map((locale) =>
//       slugs.map((slug) => ({
//         slug,
//         locale,
//       }))
//     )
//     .flat();
// }

export default async function BlogPostPage({ params }: { params: { slug: string; locale: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    redirect('/blog');
  }

  const { title, contentType, content, author, createdAt, tags } = post;

  const formattedDate = new Date(createdAt).toLocaleDateString(params.locale);

  return (
    <div>
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
        {contentType === 'mdx' ? (
          <Suspense>
            {/* @ts-ignore */}
            <MDXRemote source={content} components={mdxComponents} />
          </Suspense>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }}></div>
        )}
      </div>
    </div>
  );
}
