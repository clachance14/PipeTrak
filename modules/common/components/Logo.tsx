import { Link } from 'next-intl';

export default function Logo({ link }: { link?: string }) {
  return (
    <Link
      href={link ?? '/'}
      className="block text-2xl font-semibold leading-none text-black hover:no-underline focus:no-underline dark:text-white"
    >
      supastarter.<span className="text-blue-500">nextjs</span>
    </Link>
  );
}
