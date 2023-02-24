import { getAuthOptions } from '@auth/server';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import prisma from '../prisma/prisma';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, getAuthOptions(req));

  return {
    session,
    prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
