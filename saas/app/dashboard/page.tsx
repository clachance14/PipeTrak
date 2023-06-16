import { getUser } from '@auth/server';
import { PageHeader } from '@dashboard/components/PageHeader';
import { StatsTile } from '@dashboard/components/StatsTile';
import { getTranslations, redirect } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');

  return {
    title: t('title'),
  };
}

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/sigin');
  }

  return (
    <div>
      <PageHeader title={`Welcome ${user.name}`} subtitle="See the latest stats of your awesome business." />

      <div className="container py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <StatsTile title="New client" value={344} valueFormat="number" trend={0.12} />
          <StatsTile title="Revenue" value={5243} valueFormat="currency" trend={0.6} />
          <StatsTile title="Churn" value={0.03} valueFormat="percentage" trend={-0.3} />
        </div>

        <div className="mt-8 flex min-h-[40vh] items-center justify-center rounded-xl bg-zinc-100 p-12 dark:bg-zinc-800">
          <div>Here you can add your own content.</div>
        </div>
      </div>
    </div>
  );
}
