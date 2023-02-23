import { Button } from '@common/client';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { AppLayout } from '../../common/client/components/AppLayout';

export function DashboardPage() {
  return (
    <AppLayout>
      <p className="mt-4">Welcome to the dashboard</p>

      <Link href="/admin">Admin &rarr;</Link>

      <Button onClick={() => signOut()}>Sign out</Button>
    </AppLayout>
  );
}
