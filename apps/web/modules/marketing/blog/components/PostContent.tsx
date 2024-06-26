"use client";

import { MDXContent } from "@content-collections/mdx/react";
import { mdxComponents } from "../utils/mdx-components";

export function PostContent({ content }: { content: string }) {
	return (
		<div className="prose mx-auto mt-6 max-w-2xl dark:prose-invert">
			<MDXContent
				code={content}
				components={{
					a: mdxComponents.a,
				}}
			/>
		</div>
	);
}
