'use client';

import { Link } from 'next-intl';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useMemo } from 'react';

export function TabGroup({
  items,
  className,
}: {
  items: { label: string; href: string; segment: string }[];
  className?: string;
}) {
  const selectedSegment = useSelectedLayoutSegment();
  const activeItem = useMemo(() => {
    return items.find((item) => item.segment === selectedSegment);
  }, [items, selectedSegment]);

  return (
    <div className={`flex border-b-2 dark:border-zinc-800 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`-mb-[2px] block border-b-2 px-6 py-3 hover:no-underline focus:no-underline ${
            item === activeItem ? 'border-blue-500 font-bold dark:text-white' : 'border-transparent'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
