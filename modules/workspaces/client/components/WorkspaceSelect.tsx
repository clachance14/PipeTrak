import { Select } from '@common/client';
import { trpc } from '@common/server';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';

export function WorkspacesSelect() {
  const { data: session } = useSession();
  const { data: workspaces } = trpc.workspaces.useQuery();
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(session?.user.workspaceId);

  const onChange = async (value: string) => {
    setWorkspaceId(value);
    if (value && value !== workspaceId) {
      await fetch('/api/auth/session?workspaceId=' + value);
      router.reload();
    }
  };

  if (!session) return null;

  return (
    <Select
      size="small"
      placeholder="Select a workspace"
      value={workspaceId}
      onChange={(value) => onChange((value as string) ?? undefined)}
      options={[
        { label: `Personal workspace`, value: session.user.id },
        ...(workspaces?.map((workspace) => ({
          label: workspace.name,
          value: workspace.id,
        })) ?? []),
      ]}
    />
  );
}
