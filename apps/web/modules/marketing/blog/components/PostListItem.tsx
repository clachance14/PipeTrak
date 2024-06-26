"use client";

import { Link } from "@i18n";
import type { Post } from "content-collections";
import Image from "next/image";

export function PostListItem({ post }: { post: Post }) {
	const { title, excerpt, authorName, image, date, path, authorImage, tags } =
		post;

	return (
		<div className="rounded-2xl border bg-card/50 p-6">
			{image && (
				<div className="relative -mx-4 -mt-4 mb-4 aspect-[16/9] overflow-hidden rounded-xl">
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center"
					/>
					<Link href={`/blog/${path}`} className="absolute inset-0" />
				</div>
			)}

			{tags && (
				<div className="mb-2 flex flex-wrap gap-2">
					{tags.map((tag) => (
						<span
							key={tag}
							className="text-xs font-semibold uppercase tracking-wider text-primary"
						>
							#{tag}
						</span>
					))}
				</div>
			)}

			<Link href={`/blog/${path}`} className="text-xl font-semibold">
				{title}
			</Link>
			{excerpt && <p className="opacity-50">{excerpt}</p>}

			<div className="mt-4 flex items-center justify-between">
				{authorName && (
					<div className="flex items-center">
						{authorImage && (
							<div className="relative mr-2 size-8 overflow-hidden rounded-full">
								<Image
									src={authorImage}
									alt={authorName}
									fill
									sizes="96px"
									className="object-cover object-center"
								/>
							</div>
						)}
						<div>
							<p className="text-sm font-semibold opacity-50">{authorName}</p>
						</div>
					</div>
				)}

				<div className="ml-auto mr-0">
					<p className="text-sm opacity-30">
						{Intl.DateTimeFormat("en-US").format(new Date(date))}
					</p>
				</div>
			</div>
		</div>
	);
}
