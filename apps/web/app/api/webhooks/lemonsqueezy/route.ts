import { createHmac, timingSafeEqual } from "crypto";
import { Subscription, db } from "database";
import { headers } from "next/headers";
import { env } from "../../../../env.mjs";

async function updateUserSubscription(
  subscription: Subscription,
): Promise<void | Subscription> {
  if (!subscription.team_id) throw new Error("team_id must be provided");

  const existingSubscription = await db.subscription.findFirst({
    where: {
      team_id: subscription.team_id,
    },
  });

  try {
    if (existingSubscription)
      return await db.subscription.update({
        data: subscription,
        where: {
          id: existingSubscription.id,
        },
      });

    await db.subscription.create({
      data: subscription,
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
          id: String(data.id),
          team_id: customData?.team_id,
          customer_id: String(data.attributes.customer_id),
          plan_id: String(data.attributes.product_id),
          variant_id: String(data.attributes.variant_id),
          status: data.attributes.status,
          next_payment_date: new Date(
            data.attributes.trial_ends_at ?? data.attributes.renews_at,
          ),
        });
        break;
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
    status: 204,
  });
}
