import { getUser } from '@auth/server';
import { prisma } from '@database/prisma';
import { Subscription } from '@prisma/client';

export async function updateUserSubscription(
  subscription: Omit<Subscription, 'id'> & {
    userId?: string;
  }
) {
  if (!subscription.userId) {
    throw new Error('Either customerId or userId must be provided');
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: subscription.userId,
    },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: {
        id: existingSubscription.id,
      },
      data: {
        ...subscription,
      },
    });

    return;
  }

  await prisma.subscription.create({
    data: {
      ...subscription,
    },
  });
}

export const getUserSubscription = async () => {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
    },
  });

  return subscription;
};
