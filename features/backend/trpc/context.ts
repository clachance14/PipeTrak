import { getAuthOptions } from '@auth/providers/nextauth';
import { prisma } from '@database/prisma';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, getAuthOptions());

  return {
    session,
    prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
