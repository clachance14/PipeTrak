import { BlogPost } from '../../types';

const posts: BlogPost[] = [
  {
    slug: 'first-post',
    title: 'First Post',
    createdAt: '2020-01-01',
    excerpt: 'This is my first post',
    content: `# First Post

This is my first post`,
    contentType: 'mdx',
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    createdAt: '2020-01-02',
    excerpt: 'This is my second post',
    content: `# Second Post

This is my second post and with some more content`,
    contentType: 'mdx',
  },
];

export async function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getPosts() {
  return posts;
}

export function getPostSlugs() {
  return posts.map((post) => post.slug);
}
