export type GetAllPlans = () => Promise<SubscriptionPlan[]>;

export type CreateCheckoutLink = (params: {
  planId: string;
  variantId: string;
  userData: {
    email: string;
    name: string;
    id: string;
  };
  redirectUrl?: string;
}) => Promise<string>;

export type CreateCustomerPortalLink = (params: {
  subscriptionId: string;
}) => Promise<string>;

export type CancelSubscription = (params: {
  subscriptionId: string;
}) => Promise<void>;

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  currency: string;
  storeId?: string;
  variants: SubscriptionPlanVariant[];
}

export interface SubscriptionPlanVariant {
  id: string | number;
  price: number;
  interval: string;
  interval_count: number;
  checkoutLink?: string;
}
