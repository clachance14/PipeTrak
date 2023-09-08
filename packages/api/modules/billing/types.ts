import { z } from "zod";

export type GetAllPlans = () => Promise<SubscriptionPlan[]>;

export type CreateCheckoutLink = (params: {
  planId: string;
  variantId: string;
  email?: string;
  name?: string;
  teamId: string;
  redirectUrl?: string;
}) => Promise<string>;

export type CreateCustomerPortalLink = (params: {
  subscriptionId: string;
}) => Promise<string>;

export type CancelSubscription = (params: { id: string }) => Promise<void>;

export type ResumeSubscription = (params: { id: string }) => Promise<{
  status: string;
}>;

export const SubscriptionPlanModel = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  currency: z.string(),
  storeId: z.string().optional(),
  variants: z.array(
    z.object({
      id: z.string(),
      price: z.number(),
      interval: z.string(),
      interval_count: z.number(),
      checkout_link: z.string().optional(),
    }),
  ),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanModel>;

export interface SubscriptionPlanVariant {
  id: string | number;
  price: number;
  interval: string;
  interval_count: number;
  checkoutLink?: string;
}
