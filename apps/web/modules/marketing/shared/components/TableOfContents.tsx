import Link from "next/link";

export function TableOfContents({
  items,
}: {
  items: { slug: string; content: string; lvl: number }[];
}) {
  return (
    <div className="w-full max-w-64 self-start rounded-lg border p-4">
      <h3 className="mb-2 text-base font-semibold">Table of contents</h3>
      <nav className="list-none space-y-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`#${item.slug}`}
            className={`block text-sm ${`ml-${Math.max(0, item.lvl - 2) * 2}`}`}
          >
            {item.content}
          </Link>
        ))}
      </nav>
    </div>
  );
}
