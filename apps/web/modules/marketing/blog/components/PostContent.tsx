"use client";

import { MDXContent } from "@content-collections/mdx/react";

export function PostContent({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert mx-auto mt-6 max-w-2xl">
      <MDXContent code={content} />
    </div>
  );
}
