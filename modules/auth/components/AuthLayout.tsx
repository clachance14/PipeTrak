import { getUser } from '@auth/server/user';
import Logo from '@common/components/Logo';
import { Link } from 'next-intl';
import { getTranslations, redirect } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function AuthLayout({ children }: PropsWithChildren<{}>) {
  const t = await getTranslations('auth');
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <div className="bg-zinc-100 dark:bg-zinc-800">
        <div className="grid min-h-screen lg:grid-cols-2">
          <div className="flex items-center justify-center bg-white p-12 dark:bg-zinc-900">
            <div className="flex h-full w-full max-w-md flex-col justify-between gap-8">
              <div>
                <Link href="/">&larr; {t('backToHomepage')}</Link>
              </div>

              <div>
                <div className="mb-8">
                  <Logo />
                </div>

                {children}
              </div>

              <div className="flex items-center justify-between italic text-zinc-400">{/* <ColorModeToggle /> */}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
