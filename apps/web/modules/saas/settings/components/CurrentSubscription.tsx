"use client";

import { ActionBlock } from "@saas/shared/components";
import { Badge, Button, Icon } from "@ui/components";
import { ApiOutput } from "api";
import { useFormatter, useTranslations } from "next-intl";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";

type SubscriptionPlan = ApiOutput["billing"]["plans"][number];

export function CurrentSubscription({
  plans,
  userSubscription,
  className,
}: {
  plans: SubscriptionPlan[];
  userSubscription?: ApiOutput["team"]["subscription"];
  className?: string;
}) {
  const format = useFormatter();
  const t = useTranslations();

  const freePlan: SubscriptionPlan = {
    id: "free",
    name: t("settings.billing.subscription.freePlan.title"),
    currency: "usd",
    variants: [
      {
        id: "free",
        interval_count: 1,
        price: 0,
        interval: "month",
      },
    ],
  };

  const hasActiveSubscription =
    userSubscription?.status &&
    !["expired", "cancelled"].includes(userSubscription.status);

  const activePlanId = hasActiveSubscription
    ? userSubscription.plan_id
    : "free";
  const activeVariantId = hasActiveSubscription
    ? userSubscription.variant_id
    : "free";

  const subscriptionPlan = [freePlan, ...plans].find(
    (plan) => plan.id === activePlanId,
  );
  const subscriptionVariant = subscriptionPlan?.variants.find(
    (variant) => variant.id === activeVariantId,
  );

  if (!subscriptionPlan || !subscriptionVariant) {
    return null;
  }

  return (
    <ActionBlock
      title={t("settings.billing.subscription.currentSubscription")}
      className={className}
    >
      <div className="flex items-center gap-2">
        <h4 className="text-primary text-xl">
          <span>{subscriptionPlan.name} </span>
          <small>
            (
            {format.number(subscriptionVariant.price / 100, {
              style: "currency",
              currency: subscriptionPlan.currency,
            })}
            /
            {t(
              `settings.billing.subscription.${subscriptionVariant.interval}` as any,
            )}
            )
          </small>
        </h4>
        {userSubscription?.status && (
          <Badge
            status={
              ["on_trial", "active"].includes(userSubscription.status)
                ? "success"
                : "error"
            }
          >
            {t(
              `settings.billing.subscription.status.${userSubscription.status}` as any,
            )}
          </Badge>
        )}
      </div>

      {userSubscription?.next_payment_date && (
        <p className="text-muted-foreground mt-1">
          {t.rich(
            !hasActiveSubscription
              ? "settings.billing.subscription.endsOn"
              : "settings.billing.subscription.nextPayment",
            {
              nextPaymentDate: userSubscription.next_payment_date,
              strong: (text) => <strong>{text}</strong>,
            },
          )}
        </p>
      )}

      {hasActiveSubscription && (
        <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t px-6 py-3">
          <div className="flex w-full flex-col justify-between gap-3 md:flex-row">
            <div>
              <Button asChild variant="ghost" className="w-full md:w-auto">
                <a
                  href={`/billing/customer-portal?subscriptionId=${userSubscription.subscription_id}`}
                >
                  <Icon.creditCard className="h-4 w-4" />
                  {t("settings.billing.subscription.updateBillingDetails")}
                </a>
              </Button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {hasActiveSubscription && (
                <CancelSubscriptionButton
                  subscriptionId={userSubscription.subscription_id}
                  label={t("settings.billing.subscription.cancel")}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ActionBlock>
  );
}
