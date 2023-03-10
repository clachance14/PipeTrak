import { getServerSession } from 'next-auth';
import { getAuthOptions } from '../../nextauth.config';

import { TRPCError } from '@trpc/server';
import { hash } from 'argon2';
import z from 'zod';
import prisma from '../../prisma/prisma';
import { procedure } from '../../trpc';

export async function getUser() {
  return (await getServerSession(getAuthOptions()))?.user ?? null;
}

export const authRouter = {
  /*
   * This mutation is used to create a new user
   */
  signUp: procedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input: { email, password, name } }) => {
      const exists = await prisma.user.findFirst({
        where: { email },
      });

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists.',
        });
      }

      // hash the password with argon2
      const passwordHash = await hash(password);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: passwordHash,
        },
      });

      // send verification email

      return user;
    }),

  /*
   * This mutation is used to change the password of the user.
   */
  changePassword: procedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .mutation(async ({ input: { password }, ctx: { session } }) => {
      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in.',
        });
      }

      // check password strength
      if (password.length < 8) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password too short.',
        });
      }

      const { id } = session.user;

      const user = await prisma.user.findFirst({
        where: { id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }

      const passwordHash = await hash(password);

      await prisma.user.update({
        where: { id },
        data: {
          password: passwordHash,
        },
      });
    }),

  /*
   * This mutation is used to change the email address of the user.
   */
  changeName: procedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ input: { name }, ctx: { session } }) => {
      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in.',
        });
      }

      const { id } = session.user;

      const user = await prisma.user.findFirst({
        where: { id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }

      const response = await prisma.user.update({
        where: { id },
        data: {
          name,
        },
      });
    }),

  /*
   * This is a mutation that changes the email of the user.
   * It also sets the emailVerified field to null, so that the user
   * has to verify their email again.
   */
  changeEmail: procedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .mutation(async ({ input: { email }, ctx: { session } }) => {
      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in.',
        });
      }

      const { id } = session.user;

      const user = await prisma.user.findFirst({
        where: { id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }

      // check if email is already in use
      const exists = await prisma.user.findFirst({
        where: { email },
      });

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already in use.',
        });
      }

      await prisma.user.update({
        where: { id },
        data: {
          email,
          emailVerified: null,
        },
      });
    }),
};
