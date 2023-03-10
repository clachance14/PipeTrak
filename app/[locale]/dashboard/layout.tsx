import { getUser } from '@auth/server/user';
import AppLayout from '@common/components/AppLayout';
import { getWorkspaces } from '@workspaces/server';
import { redirect } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function DashboardLayout({ children }: PropsWithChildren<{}>) {
  const workspaces = await getWorkspaces();
  const user = await getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === user.workspaceId)!;

  return (
    <AppLayout workspaces={workspaces} selectedWorkspace={selectedWorkspace.id} user={user}>
      {children}
    </AppLayout>
  );
}
