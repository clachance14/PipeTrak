"use client";

import { mdxComponents } from "app/blog/[slug]/mdx-components";
import { MDX } from "contentlayer/core";
import { useMDXComponent } from "next-contentlayer/hooks";

export function PostContent({ mdx }: { mdx: MDX }) {
  const MDXContent = useMDXComponent(mdx.code);

  return (
    <div className="prose prose-zinc dark:prose-invert mx-auto mt-6 max-w-2xl">
      <MDXContent components={mdxComponents} />
    </div>
  );
}
