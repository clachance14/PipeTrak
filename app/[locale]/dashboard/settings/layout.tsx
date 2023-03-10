import { PageHeader } from '@dashboard/components/PageHeader';
import { TabGroup } from '@dashboard/components/TabGroup';
import { getTranslations } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function SettingsLayout({ children }: PropsWithChildren<{}>) {
  const t = await getTranslations('settings');

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="container py-6">
        <TabGroup
          items={['account', 'billing', 'workspaces'].map((segment) => ({
            label: t(`${segment}.title` as any),
            href: `/dashboard/settings/${segment}`,
            segment,
          }))}
        />

        {children}
      </div>
    </div>
  );
}
