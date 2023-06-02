import { createContext } from '@database/trpc/context';
import { appRouter } from '@database/trpc/router';
import * as trpcNext from '@trpc/server/adapters/next';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
});
