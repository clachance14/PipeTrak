import { getUser } from '@auth/server';
import { StatsTile } from '@dashboard/components/StatsTile';
import { redirect } from 'next-intl/server';

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/sigin');
  }

  return (
    <div>
      <div className="mb-8 border-b pb-3 dark:border-zinc-800">
        <h2 className="mt-4 text-3xl font-bold">Welcome {user.name}</h2>
        <p className="mt-1 opacity-75">See the latest stats of your awesome business.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatsTile title="New client" value={344} valueFormat="number" trend={0.12} />
        <StatsTile title="Revenue" value={5243} valueFormat="currency" trend={0.6} />
        <StatsTile title="Churn" value={0.03} valueFormat="percentage" trend={-0.3} />
      </div>
    </div>
  );
}
