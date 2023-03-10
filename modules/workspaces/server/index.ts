import { getUser } from '@auth/server/user';
import prisma from '../../../prisma/prisma';

export async function getWorkspaces() {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const workspaces = [
    {
      id: user.id,
      name: 'Personal workspace',
    },
  ];

  return [
    ...workspaces,
    ...(await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            id: user.id,
          },
        },
      },
    })),
  ];
}
