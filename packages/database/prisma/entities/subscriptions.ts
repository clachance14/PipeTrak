import { Subscription } from "@prisma/client";
import { prisma } from "../util/client";

export type { Subscription } from "@prisma/client";

export const getSubscriptionByUserId = async (userId: string) => {
  return prisma.subscription.findFirst({
    where: {
      userId: userId,
    },
  });
};

export const getSubscriptionById = async (subscriptionId: string) => {
  return prisma.subscription.findFirst({
    where: {
      subscriptionId,
    },
  });
};

export const updateSubscription = async (
  subscription: Partial<Subscription>,
) => {
  return await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      ...subscription,
    },
  });
};

export const createSubscription = async (
  subscription: Omit<Subscription, "id">,
) => {
  return await prisma.subscription.create({
    data: {
      ...subscription,
    },
  });
};
