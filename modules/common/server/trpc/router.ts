import { authRouter } from '@auth/server';
import { workspacesRouter } from '@workspaces/server';
import { router } from '../../trpc';

export const appRouter = router({
  ...authRouter,
  ...workspacesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
