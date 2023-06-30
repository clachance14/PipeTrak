import { Subscription } from "@prisma/client";
import { prisma } from "../util/client";

export type { Subscription } from "@prisma/client";

export const getSubscriptionByUserId = async (
  userId: string,
): Promise<Subscription> => {
  return prisma.subscription.findFirst({
    where: {
      userId: userId,
    },
  });
};

export const getSubscriptionById = async (
  subscriptionId: string,
): Promise<Subscription> => {
  return prisma.subscription.findFirst({
    where: {
      subscriptionId,
    },
  });
};

export const updateSubscription = async (
  subscription: Partial<Subscription>,
): Promise<Subscription> => {
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
): Promise<Subscription> => {
  return await prisma.subscription.create({
    data: {
      ...subscription,
    },
  });
};
