# Payments System (Stripe)

## Overview
Supastarter provides a generic payments module for charging users and managing subscriptions. PipeTrak uses Stripe as the payment provider.

## Stripe Configuration

### API Keys (Test Environment)
```
STRIPE_PUBLISHABLE_KEY=pk_test_51RiGThQvY49jEN8HvKrQQFQ47bXjEbnujRtcHO8GdE8g9AAMznOD3OeI1YqH5pkc708xI9p8Pi6R9q8N18x3p5iy00GtsStQA3
STRIPE_SECRET_KEY=sk_test_51RiGThQvY49jEN8HzRjMacbh6j7vZHGYcJGkiwHdiPhT52qGG3xfYWxwksKgfeelM5JM2G6grk73tvQ6r0vnNX8b00NOmxc8CC
```

### Environment Variables
Add to `.env.local` and production environment:
```bash
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
STRIPE_WEBHOOK_SECRET="" # The webhook secret key (from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Your publishable key
```

### Webhook Setup

#### Local Development
Use ngrok to create a tunnel:
```bash
ngrok http 3000
```
Use the generated URL + `/api/webhooks/payments`

#### Production
Use your app's URL + `/api/webhooks/payments`

#### Required Webhook Events
Configure these events in Stripe Dashboard:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Plan Configuration

Configure plans in `config/index.ts`:

```typescript
export const config = {
  payments: {
    plans: {
      // Free tier (optional)
      free: {
        isFree: true,
      },
      
      // Pro subscription plan
      pro: {
        recommended: true,
        prices: [
          {
            type: "recurring",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
            interval: "month",
            amount: 29,
            currency: "USD",
            seatBased: true, // For organization-based pricing
            trialPeriodDays: 7,
          },
          {
            type: "recurring",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
            interval: "year",
            amount: 290,
            currency: "USD",
            seatBased: true,
            trialPeriodDays: 7,
          },
        ],
      },
      
      // Enterprise plan (contact sales)
      enterprise: {
        isEnterprise: true,
      },
      
      // One-time purchase example
      lifetime: {
        prices: [
          {
            type: "one_time",
            productId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME,
            amount: 999,
            currency: "USD",
          },
        ],
      },
    },
  },
};
```

## Checking Purchases & Subscriptions

### Client-Side
```typescript
import { usePurchases } from "@saas/payments/hooks/use-purchases";

function Component() {
  const { activePlan, hasSubscription, hasPurchase } = usePurchases();
  
  // Check for active subscription
  const hasActiveSubscription = hasSubscription();
  
  // Check specific plan purchases
  const hasProPurchase = hasPurchase("pro");
  const hasProOrEnterprise = hasPurchase(["pro", "enterprise"]);
  const hasLifetimeAccess = hasPurchase("lifetime");
  
  if (!hasProPurchase) {
    return <UpgradePrompt />;
  }
}
```

### Server Components
```typescript
import { getPurchases } from "@saas/payments/lib/server";
import { createPurchasesHelper } from "@repo/payments/lib/helper";

export default async function ServerComponent() {
  const purchases = await getPurchases();
  const { activePlan, hasSubscription, hasPurchase } = createPurchasesHelper(purchases);
  
  if (!hasPurchase("pro")) {
    return <PaywallMessage />;
  }
  
  // Protected content
}
```

### API Routes
```typescript
import { getPurchases } from "../../payments/lib/purchases";
import { createPurchasesHelper } from "@repo/payments/lib/helper";

export async function POST(request: Request) {
  // For organization-level purchases
  const purchases = await getPurchases({ organizationId });
  // Or for user-level purchases
  const purchases = await getPurchases({ userId });
  
  const { hasSubscription, hasPurchase } = createPurchasesHelper(purchases);
  
  if (!hasPurchase(["pro", "enterprise"])) {
    return new Response("Upgrade required", { status: 403 });
  }
  
  // Process request
}
```

## Organization-Based Subscriptions

For seat-based pricing where organizations (not individual users) have subscriptions:

```typescript
// Client-side with organization context
const { activeOrganization } = useActiveOrganization();
const { hasPurchase } = usePurchases({ organizationId: activeOrganization?.id });

// Server-side with organization
const purchases = await getPurchases({ organizationId: organization.id });
```

## Implementing a Paywall

To require payment before accessing the app:

```typescript
// config/index.ts
export const config = {
  payments: {
    plans: {
      free: { 
        isFree: false, // Removes free tier
      },
      // ... paid plans
    }
  },
}
```

This redirects users to `/app/choose-plan` after signup.

## Customer Portal

Stripe Customer Portal allows users to:
- Update payment methods
- Download invoices
- Cancel subscriptions

Access via:
```typescript
import { createCustomerPortalLink } from "@saas/payments/lib/stripe";

const portalUrl = await createCustomerPortalLink({
  customerId: user.stripeCustomerId,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
});
```

## Production Setup

### 1. Create Products in Stripe Dashboard
- [ ] Log into [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Navigate to Products page
- [ ] Create product for "Pro" subscription plan
  - [ ] Add monthly price ($29/month)
  - [ ] Add yearly price ($290/year)
  - [ ] Enable seat-based pricing if needed
- [ ] Create product for "Lifetime" one-time purchase ($999)
- [ ] Note all Product IDs and Price IDs

### 2. Configure Webhook Endpoint
- [ ] Go to [Webhooks page](https://dashboard.stripe.com/webhooks)
- [ ] Add production endpoint: `https://pipetrak.co/api/webhooks/payments`
- [ ] Select required events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Copy the webhook signing secret

### 3. Update Environment Variables
- [ ] Replace test Stripe keys with production keys
- [ ] Add `STRIPE_WEBHOOK_SECRET` from webhook configuration
- [ ] Update product price IDs in `.env`:
  - [ ] `NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY`
  - [ ] `NEXT_PUBLIC_PRICE_ID_PRO_YEARLY`
  - [ ] `NEXT_PUBLIC_PRICE_ID_LIFETIME`

### 4. Configure Stripe Customer Portal
- [ ] Go to [Customer Portal settings](https://dashboard.stripe.com/settings/billing/portal)
- [ ] Enable Customer Portal
- [ ] Configure allowed actions (update payment, cancel subscription, etc.)
- [ ] Set business information and branding

### 5. Test Payment Flow
- [ ] Test subscription signup with test card
- [ ] Verify webhook receives events
- [ ] Test customer portal access
- [ ] Test subscription cancellation flow

## Key Files
- Payment configuration: `config/index.ts`
- Payment hooks: `apps/web/modules/saas/payments/hooks/`
- Server utilities: `apps/web/modules/saas/payments/lib/server.ts`
- Stripe integration: `packages/payments/src/stripe/`
- Webhook handler: `apps/web/app/api/webhooks/payments/route.ts`

## Documentation Links
- [Payments Overview](https://supastarter.dev/docs/nextjs/payments/overview)
- [Stripe Provider Setup](https://supastarter.dev/docs/nextjs/payments/providers/stripe)
- [Managing Plans](https://supastarter.dev/docs/nextjs/payments/plans)
- [Checking Purchases](https://supastarter.dev/docs/nextjs/payments/check-purchases)
- [Implementing Paywall](https://supastarter.dev/docs/nextjs/payments/paywall)
- [Stripe Dashboard](https://dashboard.stripe.com)