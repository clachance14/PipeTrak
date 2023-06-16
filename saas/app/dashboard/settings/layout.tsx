import { PageHeader } from '@dashboard/components/PageHeader';
import { TabGroup } from '@dashboard/components/TabGroup';
import { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren<{}>) {
  const t = useTranslation('settings');

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
          className="mb-6"
        />

        {children}
      </div>
    </div>
  );
}
