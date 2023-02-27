import Link from 'next/link';

export function BlogPage() {
  return (
    <div>
      <h1>Blog</h1>

      <ul>
        <li>
          <Link href="/blog/first-post">First post</Link>
        </li>
        <li>
          <Link href="/blog/second-post">Second post</Link>
        </li>
      </ul>
    </div>
  );
}
