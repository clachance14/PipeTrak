import { TRPCError } from "@trpc/server";
import {
  createUser,
  getUserByEmail,
  updateUserEmail,
  updateUserName,
  updateUserPassword,
} from "auth";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../util/trpc";

export const authRouter = {
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(3),
      }),
    )
    .mutation(async ({ input: { email, password, name } }) => {
      const exists = await getUserByEmail(email);

      if (exists)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use.",
        });

      const user = await createUser({
        email,
        name,
        password,
      });

      return user;
    }),

  changePassword: publicProcedure
    .input(
      z.object({
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ input: { password } }) => {
      await updateUserPassword(password);
    }),

  changeName: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input: { name } }) => {
      await updateUserName(name);
    }),

  changeEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input: { email } }) => {
      // check if email is already in use
      const exists = await getUserByEmail(email);

      if (exists)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use.",
        });

      await updateUserEmail(email);
    }),
};
