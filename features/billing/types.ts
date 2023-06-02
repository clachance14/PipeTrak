export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  currency: string;
  storeId: string;
  variants: SubscriptionPlanVariant[];
}

export interface SubscriptionPlanVariant {
  id: string | number;
  price: number;
  interval: string;
  interval_count: number;
  checkoutLink: string;
}
