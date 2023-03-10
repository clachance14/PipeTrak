import { authRouter } from '@auth/server';
import { router } from '../../../../trpc';

export const appRouter = router({
  ...authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
