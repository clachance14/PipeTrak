import { getUserSession } from "auth";
import {
  createSubscription,
  getSubscriptionByUserId,
  Subscription,
  updateSubscription,
} from "database";

export async function updateUserSubscription(
  subscription: Omit<Subscription, "id"> & {
    userId?: string;
  },
): Promise<void | Subscription> {
  if (!subscription.userId) {
    throw new Error("Either customerId or userId must be provided");
  }

  const existingSubscription = await getSubscriptionByUserId(
    subscription.userId,
  );

  if (existingSubscription) {
    return await updateSubscription(subscription);
  }

  await createSubscription(subscription);
}

export const getUserSubscription = async (): Promise<Subscription | null> => {
  const session = await getUserSession();

  if (!session) {
    return null;
  }

  const { user } = session;

  return await getSubscriptionByUserId(user.id);
};
