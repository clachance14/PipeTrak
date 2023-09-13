import { TRPCError } from "@trpc/server";
import { Subscription, SubscriptionModel, db } from "database";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

export const syncSubscription = publicProcedure
  .input(
    z.object({
      event: z.enum(["created", "updated", "deleted"]),
      subscription: SubscriptionModel.nullable(),
    }),
  )
  .mutation(async ({ input: { event, subscription }, ctx: { isAdmin } }) => {
    // this procedure can only be called by the admin caller from a webhook
    if (!isAdmin)
      throw new TRPCError({
        code: "FORBIDDEN",
      });

    let existingSubscription: Subscription | null = null;

    if (subscription?.id) {
      existingSubscription = await db.subscription.findFirst({
        where: {
          id: subscription.id,
        },
      });
    }

    switch (event) {
      case "created":
      case "updated":
        if (!subscription)
          throw new TRPCError({
            code: "BAD_REQUEST",
          });

        try {
          if (!existingSubscription)
            await db.subscription.create({
              data: subscription,
            });
          else
            await db.subscription.update({
              where: {
                id: existingSubscription.id,
              },
              data: subscription,
            });
        } catch (e) {
          console.error(e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        break;

      case "deleted":
        if (!existingSubscription)
          throw new TRPCError({
            code: "NOT_FOUND",
          });

        try {
          await db.subscription.delete({
            where: {
              id: existingSubscription.id,
            },
          });
        } catch (e) {
          console.error(e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        break;
    }
  });
