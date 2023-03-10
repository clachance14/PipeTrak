import ColorModeToggle from '@common/components/ColorModeToggle';
import Logo from '@common/components/Logo';
import { Link } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function AuthLayout({ children }: PropsWithChildren<{}>) {
  const t = await getTranslations('auth');

  return (
    <>
      <div className="bg-zinc-100 dark:bg-zinc-800">
        <div className="grid min-h-screen lg:grid-cols-2">
          <div className="flex items-center justify-center bg-white p-12 dark:bg-zinc-900">
            <div className="flex h-full w-full max-w-md flex-col justify-between gap-8">
              <div>
                <Link href="/" className="text-sm text-zinc-900/50 dark:text-white/50">
                  &larr; {t('backToHomepage')}
                </Link>
                <div className="mt-2">
                  <Logo />
                </div>
              </div>

              <div>{children}</div>

              <div className="flex items-center justify-between pt-8 italic text-zinc-400">
                <ColorModeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
