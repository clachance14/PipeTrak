import { Button } from '@common/client';
import { signOut } from 'next-auth/react';
import { AppLayout } from '../../../common/client/components/AppLayout';

export function UsersPage() {
  return (
    <AppLayout>
      <p className="mt-4">Welcome to the admin page</p>

      <Button onClick={() => signOut()}>Sign out</Button>
    </AppLayout>
  );
}
