import { Link } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function SettingsLayout({ children }: PropsWithChildren<{}>) {
  const t = await getTranslations('settings');
  return (
    <div>
      <div className="mb-8 border-b pb-3 dark:border-zinc-800">
        <h2 className="mt-4 text-3xl font-bold">{t('title')}</h2>
        <p className="mt-1 opacity-75">{t('subtitle')}</p>
      </div>

      <ul>
        <li>
          <Link href="/dashboard/settings/account">{t('account.title')}</Link>
        </li>
        <li>
          <Link href="/dashboard/settings/workspaces">Workspaces</Link>
        </li>
      </ul>

      {children}
    </div>
  );
}
