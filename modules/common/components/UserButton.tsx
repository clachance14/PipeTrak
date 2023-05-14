'use client';

import Button from '@common/components/primitives/Button';
import { useSession } from 'next-auth/react';
import Link from 'next-intl/link';

export default function UserButton({
  labels,
}: {
  labels: {
    signIn: string;
    dashboard: string;
  };
}) {
  const { data: session } = useSession();
  return (
    <Button as={Link} href={session ? '/dashboard' : '/signin'} intent="primary-ghost" size="small">
      {session ? labels.dashboard : labels.signIn}
    </Button>
  );
}
