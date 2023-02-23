import * as trpcNext from '@trpc/server/adapters/next';
import { createContext } from '../../../modules/common/server/trpc/context';
import { appRouter } from '../../../modules/common/server/trpc/router';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
});
