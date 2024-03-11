"use client";

import { MdxContent } from "./MdxContent";

export function PostContent({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert mx-auto mt-6 max-w-2xl">
      <MdxContent code={content} />
    </div>
  );
}
