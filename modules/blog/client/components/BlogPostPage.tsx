import Link from 'next/link';

interface Props {
  title: string;
}

export function BlogPostPage(props: Props) {
  return (
    <div>
      <Link href="/blog">Back to blog</Link>
      <h1>{props.title}</h1>
    </div>
  );
}
