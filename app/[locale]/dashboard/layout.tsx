import { getUser } from '@auth/server';
import { Layout } from '@dashboard/components';
import { getWorkspaces } from '@workspaces/server';
import { redirect } from 'next-intl/server';
import { PropsWithChildren } from 'react';

export default async function DashboardLayout({ children }: PropsWithChildren<{}>) {
  const workspaces = await getWorkspaces();
  const user = await getUser();

  if (!user) {
    redirect('/signin');
  }

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === user.workspaceId)!;

  return (
    <Layout workspaces={workspaces} selectedWorkspace={selectedWorkspace.id} user={user}>
      {children}
    </Layout>
  );
}
