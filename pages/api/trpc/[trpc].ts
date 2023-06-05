import { createContext } from '@backend/trpc/context';
import { appRouter } from '@backend/trpc/router';
import * as trpcNext from '@trpc/server/adapters/next';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
});
