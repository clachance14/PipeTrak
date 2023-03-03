import prisma from '@common/server/prisma/prisma';
import { TRPCError } from '@trpc/server';
import { procedure } from '../../common/trpc';

export const workspacesRouter = {
  /*
   * Get all workspaces for the current user.
   */
  workspaces: procedure.query(async ({ ctx: { session } }) => {
    if (!session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not logged in.',
      });
    }

    const {
      user: { id },
    } = session;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            id,
          },
        },
      },
    });

    return workspaces;
  }),
};
