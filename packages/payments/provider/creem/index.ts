import { logger } from "@repo/logs";
import { joinURL } from "ufo";
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	PauseSubscription,
	ResumeSubscription,
	UpdateSubscription,
	WebhookHandler,
} from "../../types";

export function creemFetch(path: string, init: Parameters<typeof fetch>[1]) {
	const creemApiKey = process.env.CREEM_API_KEY as string;

	if (!creemApiKey) {
		throw new Error("Missing env variable CREEM_API_KEY");
	}

	const requestUrl = joinURL("https://test-api.creem.io/v1", path);
	console.log("requestUrl", requestUrl);
	return fetch(requestUrl, {
		...init,
		headers: {
			"x-api-key": creemApiKey,
			"Content-Type": "application/json",
		},
	});
}

export const createCheckoutLink: CreateCheckoutLink = async (options) => {
	const { productId, redirectUrl, organizationId, userId } = options;

	const response = await creemFetch("/checkouts", {
		method: "POST",
		body: JSON.stringify({
			product_id: productId,
			success_url: redirectUrl ?? undefined,
			metadata: {
				organization_id: organizationId || null,
				user_id: userId || null,
			},
		}),
	});

	if (!response.ok) {
		logger.error("Failed to create checkout link", await response.json());
		throw new Error("Failed to create checkout link");
	}

	const { checkout_url } = await response.json();

	return checkout_url;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
	customerId,
}) => {
	const response = await creemFetch("/billing-portal/sessions", {
		method: "POST",
		body: JSON.stringify({
			customer_id: customerId,
		}),
	});

	const { customer_portal_link } = await response.json();

	return customer_portal_link;
};

export const pauseSubscription: PauseSubscription = async ({ id }) => {};

export const updateSubscription: UpdateSubscription = async ({
	id,
	productId,
}) => {
	return {
		status: "active",
	};
};

export const cancelSubscription: CancelSubscription = async ({ id }) => {};

export const resumeSubscription: ResumeSubscription = async ({ id }) => {
	return {
		status: "active",
	};
};

export const webhookHandler: WebhookHandler = async (req) => {
	// const stripeClient = getStripeClient();
	// if (!req.body) {
	// 	return new Response("Invalid request.", {
	// 		status: 400,
	// 	});
	// }
	// let event: Stripe.Event | undefined;
	// try {
	// 	event = await stripeClient.webhooks.constructEventAsync(
	// 		await req.text(),
	// 		req.headers.get("stripe-signature") as string,
	// 		process.env.STRIPE_WEBHOOK_SECRET as string,
	// 	);
	// } catch (e) {
	// 	logger.error(e);
	// 	return new Response("Invalid request.", {
	// 		status: 400,
	// 	});
	// }
	// try {
	// 	switch (event.type) {
	// 		case "checkout.session.completed": {
	// 			const checkoutSessionId = event.data.object.id;
	// 			const { mode, metadata, customer } = event.data.object;
	// 			const checkoutSession = await stripeClient.checkout.sessions.retrieve(
	// 				checkoutSessionId,
	// 				{
	// 					expand: ["line_items"],
	// 				},
	// 			);
	// 			const productId = checkoutSession.line_items?.data[0].price?.id;
	// 			if (!productId) {
	// 				return new Response("Missing product ID.", {
	// 					status: 400,
	// 				});
	// 			}
	// 			if (mode === "subscription") {
	// 				const subscriptionId = event.data.object.subscription as string;
	// 				await db.purchase.create({
	// 					data: {
	// 						subscriptionId,
	// 						organizationId: metadata?.organization_id || null,
	// 						userId: metadata?.user_id || null,
	// 						customerId: customer as string,
	// 						type: "SUBSCRIPTION",
	// 						productId,
	// 					},
	// 				});
	// 			} else if (mode === "payment") {
	// 				await db.purchase.create({
	// 					data: {
	// 						organizationId: metadata?.organization_id || null,
	// 						userId: metadata?.user_id || null,
	// 						customerId: customer as string,
	// 						type: "ONE_TIME",
	// 						productId,
	// 					},
	// 				});
	// 			}
	// 			break;
	// 		}
	// 		case "customer.subscription.updated": {
	// 			const subscriptionId = event.data.object.id;
	// 			const existingPurchase = await db.purchase.findUnique({
	// 				where: {
	// 					subscriptionId,
	// 				},
	// 			});
	// 			if (existingPurchase) {
	// 				await db.purchase.update({
	// 					data: {
	// 						status: event.data.object.status,
	// 						productId: event.data.object.items?.data[0].price?.id,
	// 					},
	// 					where: {
	// 						subscriptionId,
	// 					},
	// 				});
	// 			}
	// 			break;
	// 		}
	// 		case "customer.subscription.deleted": {
	// 			await db.purchase.delete({
	// 				where: {
	// 					subscriptionId: event.data.object.id,
	// 				},
	// 			});
	// 			break;
	// 		}
	// 		default:
	// 			return new Response("Unhandled event type.", {
	// 				status: 200,
	// 			});
	// 	}
	// 	return new Response(null, { status: 204 });
	// } catch (error) {
	// 	return new Response(
	// 		`Webhook error: ${error instanceof Error ? error.message : ""}`,
	// 		{
	// 			status: 400,
	// 		},
	// 	);
	// }

	return new Response("ok", {
		status: 200,
	});
};
