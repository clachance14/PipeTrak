import { getUser } from "auth";
import { getSubscriptionByUserId, Subscription } from "database";

export async function updateUserSubscription(
  subscription: Omit<Subscription, "id"> & {
    userId?: string;
  },
) {
  if (!subscription.userId) {
    throw new Error("Either customerId or userId must be provided");
  }

  const existingSubscription = await getSubscriptionByUserId(
    subscription.userId,
  );

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
