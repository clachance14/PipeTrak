import { getUser } from '@auth/server/user';
import { Link } from 'next-intl';
import { redirect } from 'next-intl/server';

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/sigin');
  }

  return (
    <div>
      Clients <br />
      <Link href="/dashboard">Home</Link>
    </div>
  );
}
