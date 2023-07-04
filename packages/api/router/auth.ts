import { TRPCError } from "@trpc/server";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  updateUserEmail,
} from "database";
import { z } from "zod";
import { hash } from "../util/hash";
import { protectedProcedure, publicProcedure } from "../util/trpc";

export const authRouter = {
  /*
   * This mutation is used to create a new user
   */
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

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists.",
        });
      }

      // hash the password with argon2
      const passwordHash = await hash(password);

      const user = await createUser({
        email,
        name,
        password: passwordHash,
      });

      // send verification email

      return user;
    }),

  /*
   * This mutation is used to change the password of the user.
   */
  changePassword: publicProcedure
    .input(
      z.object({
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ input: { password }, ctx: { session } }) => {
      const { id } = session!.user;

      const user = await getUserById(id);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const passwordHash = await hash(password);

      await updateUser({
        id,
        password: passwordHash,
      });
    }),

  /*
   * This mutation is used to change the email address of the user.
   */
  changeName: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ input: { name }, ctx: { session } }) => {
      const { id } = session!.user;

      const user = getUserById(id);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      await updateUser({
        id,
        name,
      });
    }),

  /*
   * This is a mutation that changes the email of the user.
   * It also sets the emailVerified field to null, so that the user
   * has to verify their email again.
   */
  changeEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input: { email }, ctx: { session } }) => {
      const { id } = session!.user;

      const user = await getUserById(id);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      // check if email is already in use
      const exists = await getUserByEmail(email);

      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use.",
        });
      }

      await updateUserEmail(id, email);
    }),
};
