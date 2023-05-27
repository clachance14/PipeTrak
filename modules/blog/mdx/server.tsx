import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import sizeOf from 'image-size';
import { isAbsolute, join } from 'path';
import { config } from '../config';
import { BlogPost } from '../types';

const CONTENT_PATH = config.contentPath;

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fileContent = await readFile(join(CONTENT_PATH, `${slug}.mdx`), 'utf8');

  if (!fileContent) return null;

  const { content, data: frontMatter } = matter(fileContent);

  return {
    slug,
    content,
    contentType: 'mdx',
    createdAt: frontMatter.createdAt ?? null,
    title: frontMatter.title,
    excerpt: frontMatter.excerpt ?? null,
    tags: frontMatter.tags ?? [],
    published: frontMatter.published ?? false,
    author: {
      name: frontMatter.authorName ?? null,
      image: frontMatter.authorImage ?? null,
      link: frontMatter.authorLink ?? null,
    },
  };
}

export async function getPostSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  try {
    const files = await readdir(join(process.cwd(), CONTENT_PATH));

    files.forEach((file) => {
      if (!file.endsWith('.mdx')) return;

      slugs.push(file.replace('.mdx', ''));
    });
  } catch {
    console.error(`Could not read posts directory ${CONTENT_PATH}`);
  }

  return slugs;
}

export async function getPosts(): Promise<BlogPost[]> {
  const slugs = await getPostSlugs();
  return (await Promise.all(slugs.map(async (slug) => await getPostBySlug(slug)))).filter(
    (entry) => entry !== null
  ) as BlogPost[];
}

export function getImageSize(src: string, dir?: string) {
  const absolutePathRegex = /^(?:[a-z]+:)?\/\//;
  if (absolutePathRegex.exec(src)) return;

  const shouldJoin = !isAbsolute(src) || src.startsWith('/');
  if (dir && shouldJoin) src = join(dir, src);

  return sizeOf(src);
}
