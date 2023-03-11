import { getUser } from '@auth/server';
import prisma from '../../prisma/prisma';

export async function getProjects() {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const { id, workspaceId } = user;

  // we want to get the projects that belong to the user
  // if the user is in a workspace, we want to get the projects that belong to the workspace
  // otherwise, we want to get the personal projects
  const projects = await prisma.project.findMany({
    where:
      workspaceId === id
        ? {
            userId: user.id,
            OR: [
              {
                workspaceId: user.workspaceId,
              },
              {
                workspaceId: null,
              },
            ],
          }
        : {
            workspaceId: user.workspaceId,
          },
  });

  return projects;
}
