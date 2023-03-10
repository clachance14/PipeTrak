'use client';

import Select from '@common/components/primitives/Select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WorkspacesSelect({
  workspaces,
  selectedWorkspace,
}: {
  workspaces: { id: string; name: string }[];
  selectedWorkspace: string;
}) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(selectedWorkspace);

  const onChange = async (value: string) => {
    setWorkspaceId(value);
    if (value && value !== workspaceId) {
      await fetch('/api/auth/session?workspaceId=' + value);
      router.refresh();
    }
  };

  return (
    <Select
      size="small"
      placeholder="Select a workspace"
      value={workspaceId}
      onChange={(value) => onChange((value as string) ?? undefined)}
      options={workspaces.map((workspace) => ({
        label: workspace.name,
        value: workspace.id,
      }))}
    />
  );
}
