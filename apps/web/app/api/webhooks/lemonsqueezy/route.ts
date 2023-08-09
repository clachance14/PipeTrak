import { Subscription } from "api";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "database";
import { env } from "env.mjs";
import { headers } from "next/headers";

async function updateUserSubscription(
  subscription: Omit<Subscription, "id"> & {
    userId?: string;
  },
): Promise<void | Subscription> {
  if (!subscription.userId) {
    throw new Error("Either customerId or userId must be provided");
  }

  const existingSubscription = await db.subscription.findFirst({
    where: {
      userId: subscription.userId,
    },
  });

  try {
    if (existingSubscription) {
      return await db.subscription.update({
        data: subscription,
        where: {
          id: existingSubscription.id,
        },
      });
    }

    await db.subscription.create({
      data: {
        ...subscription,
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error("Could not upsert subscription");
  }
}

export async function POST(req: Request) {
  const lemonsqueezySigningSecret = env.LEMONSQUEEZY_SIGNING_SECRET;

  try {
    const text = await req.text();
    const hmac = createHmac("sha256", lemonsqueezySigningSecret);
    const digest = Buffer.from(hmac.update(text).digest("hex"), "utf8");
    const signature = Buffer.from(
      headers().get("x-signature") as string,
      "utf8",
    );

    if (!timingSafeEqual(digest, signature))
      return new Response("Invalid signature.", {
        status: 400,
      });

    const payload = JSON.parse(text);

    const {
      meta: { event_name: eventName, custom_data: customData },
      data,
    } = payload;

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_resumed":
        await updateUserSubscription({
          userId: customData?.user_id,
          customerId: String(data.attributes.customer_id),
          planId: String(data.attributes.product_id),
          variantId: String(data.attributes.variant_id),
          status: data.attributes.status,
          subscriptionId: String(data.id),
          nextPaymentDate: new Date(
            data.attributes.trial_ends_at ?? data.attributes.renews_at,
          ),
        });
        break;
      default:
        throw new Error(`🤷‍♀️ Unhandled event: ${eventName}`);
    }
  } catch (error: unknown) {
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : ""}`,
      {
        status: 400,
      },
    );
  }

  return new Response(null, {
    status: 200,
  });
}
