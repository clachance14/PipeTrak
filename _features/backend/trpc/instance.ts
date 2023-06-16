import { Context } from '@backend/trpc/context';
import { initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const procedure = t.procedure;
