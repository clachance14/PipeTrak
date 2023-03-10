'use client';

import { BlogPost } from '@blog/types';
import Image from 'next/image';
import Link from 'next/link';

export function PostListItem({ post }: { post: BlogPost }) {
  const { title, excerpt, author, slug, createdAt, tags } = post;

  const formattedDate = new Date(createdAt).toLocaleDateString('en');

  return (
    <div className="rounded-xl border p-6 dark:border-zinc-800">
      {tags && (
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-semibold uppercase tracking-wider text-blue-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Link href={`/blog/${slug}`} className="text-xl font-semibold text-zinc-900 dark:text-white">
        {title}
      </Link>
      {excerpt && <p className="opacity-50">{excerpt}</p>}

      <div className="mt-4 flex items-center justify-between">
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

        <div className="ml-auto mr-0">
          <p className="text-sm opacity-30">{formattedDate}</p>
        </div>
      </div>
    </div>
  );
}
