import { authRouter } from '@auth/server';
import { billingRouter } from '@billing/server';
import { router } from './instance';

export const appRouter = router({
  ...authRouter,
  ...billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
