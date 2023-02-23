import prisma from '@common/server/prisma/prisma';
import { TRPCError } from '@trpc/server';
import { hash } from 'argon2';
import z from 'zod';
import { procedure } from '../../common/trpc';

export const authRouter = {
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

      const { email } = session.user;

      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        });
      }

      const passwordHash = await hash(password);

      await prisma.user.update({
        where: { email },
        data: {
          password: passwordHash,
        },
      });
    }),
};
