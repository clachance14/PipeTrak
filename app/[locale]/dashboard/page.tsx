import { getUser } from '@auth/server';
import { PageHeader } from '@dashboard/components/PageHeader';
import { StatsTile } from '@dashboard/components/StatsTile';
import { redirect } from 'next-intl/server';

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
      </div>
    </div>
  );
}
