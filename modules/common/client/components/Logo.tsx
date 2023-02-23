import Link from 'next/link';

export function Logo({ link }: { link?: string }) {
  return (
    <Link
      href={link ?? '/'}
      className="block text-3xl font-normal leading-none text-black hover:no-underline focus:no-underline dark:text-white"
    >
      aviato.
    </Link>
  );
}
