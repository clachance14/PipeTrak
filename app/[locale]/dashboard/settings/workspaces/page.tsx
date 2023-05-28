import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('settings.workspaces');

  return {
    title: t('title'),
  };
}

export default async function WorkspaceSettingsPage() {
  return <div className="grid gap-6">Workspaces settings</div>;
}
