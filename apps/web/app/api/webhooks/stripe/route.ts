import { createAdminApiCaller } from "api/modules/trpc";
import { createHmac, timingSafeEqual } from "crypto";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const hmac = createHmac(
      "sha256",
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
    const signatureHeader = headers().get("stripe-signature") as string;
    const signatureParts = signatureHeader
      .split(",")
      .map((part) => part.split("="));
    const signatureKey =
      signatureParts.find((part) => part[0] === "v1")?.[1] ?? "";
    const signatureTimestamp =
      signatureParts.find((part) => part[0] === "t")?.[1] ?? "";
    const digest = Buffer.from(
      hmac.update(`${signatureTimestamp}.${text}`).digest("hex"),
      "utf8",
    );
    const signature = Buffer.from(signatureKey, "utf8");

    if (!timingSafeEqual(digest, signature))
      return new Response("Invalid signature.", {
        status: 400,
      });

    const payload = JSON.parse(text);

    const eventMap = {
      "customer.subscription.created": "created",
      "customer.subscription.updated": "updated",
      "customer.subscription.deleted": "deleted",
    };

    const event = eventMap[payload?.type] ?? null;
    const data = payload?.data.object;

    const apiCaller = await createAdminApiCaller();

    if (!event || !data) throw new Error("Invalid event.");

    await apiCaller.billing.syncSubscription({
      event,
      subscription: {
        id: String(data.id),
        team_id: data.metadata?.team_id,
        customer_id: String(data.customer),
        plan_id: String(data.plan.product),
        variant_id: String(data.plan.id),
        status: data.status,
        next_payment_date: new Date(
          data.trial_end ?? data.billing_cycle_anchor,
        ),
      },
    });
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
