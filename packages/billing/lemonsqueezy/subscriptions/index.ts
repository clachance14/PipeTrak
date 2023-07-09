import {
  CancelSubscription,
  CreateCheckoutLink,
  CreateCustomerPortalLink,
  GetAllPlans,
  SubscriptionPlan,
} from "../../types";
import { env } from "../env.mjs";
import { lemonsqueezyApi } from "../util/api-client";

const getAllPlans: GetAllPlans = async function () {
  const response = await lemonsqueezyApi("/products?include=variants,store");

  return response.data
    .map((product: any): SubscriptionPlan => {
      const store = response.included.find(
        (item: any) =>
          item.type === "stores" &&
          Number(product.attributes.store_id) === Number(item.id),
      );
      const currency = store.attributes.currency ?? "USD";

      return {
        id: product.id,
        name: product.attributes.name,
        description: product.attributes.description,
        currency,
        storeId: String(store.id),
        variants: response.included
          .filter(
            (item: any) =>
              item.type === "variants" &&
              item.attributes.is_subscription &&
              Number(item.attributes.product_id) === Number(product.id),
          )
          .map((variant: any) => ({
            id: variant.id,
            interval: variant.attributes.interval,
            interval_count: variant.attributes.interval_count,
            price: variant.attributes.price,
            checkoutLink: product.attributes.buy_now_url,
          })),
      };
    })
    .filter((product: any) => product.variants.length > 0);
};

const createCheckoutLink: CreateCheckoutLink = async function ({
  variantId,
  userData,
  redirectUrl,
}) {
  const response = await lemonsqueezyApi("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            enabled_variants: [variantId],
            redirect_url: redirectUrl,
          },
          checkout_data: {
            email: userData.email,
            name: userData.name,
            custom: {
              user_id: userData.id,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(env.LEMONSQUEEZY_STORE_ID),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  return response.data.attributes.url;
};

const createCustomerPortalLink: CreateCustomerPortalLink = async (params) => {
  const { subscriptionId } = params;

  const response = await lemonsqueezyApi(`/subscriptions/${subscriptionId}`);

  return response.data.attributes.urls.update_payment_method;
};

const cancelSubscription: CancelSubscription = async (params) => {
  const { subscriptionId } = params;

  await lemonsqueezyApi(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
};

export {
  cancelSubscription,
  createCheckoutLink,
  createCustomerPortalLink,
  getAllPlans,
};
