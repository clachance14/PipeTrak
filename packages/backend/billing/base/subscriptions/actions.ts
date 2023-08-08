import { getUserSession } from "@supastarter/backend/auth";
import {
  createSubscription,
  getSubscriptionByUserId,
  Subscription,
  updateSubscription,
} from "@supastarter/backend/database";

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

  try {
    if (existingSubscription) {
      return await updateSubscription(subscription);
    }

    await createSubscription(subscription);
  } catch (e) {
    console.error(e);
    throw new Error("Could not upsert subscription");
  }
}

export const getUserSubscription = async (): Promise<Subscription | null> => {
  const session = await getUserSession();

  if (!session) {
    return null;
  }

  const { user } = session;

  return await getSubscriptionByUserId(user.id);
};
