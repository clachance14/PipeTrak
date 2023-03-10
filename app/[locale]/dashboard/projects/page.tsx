import { getUser } from '@auth/server';
import { PageHeader } from '@dashboard/components/PageHeader';
import { Link } from 'next-intl';
import { redirect } from 'next-intl/server';

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/sigin');
  }

  return (
    <div>
      <PageHeader title="Projects" subtitle="Manage your projects" />

      <div className="container py-6">
        <Link href="/dashboard">Home</Link>
      </div>
    </div>
  );
}
