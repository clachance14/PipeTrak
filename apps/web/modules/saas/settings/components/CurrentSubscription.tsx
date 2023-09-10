"use client";

import { ActionBlock } from "@saas/shared/components";
import { useLocaleCurrency } from "@shared/hooks";
import { Badge, Button, Icon } from "@ui/components";
import { ApiOutput } from "api";
import { useFormatter, useTranslations } from "next-intl";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { ResumeSubscriptionButton } from "./ResumeSubscriptionButton";

type SubscriptionPlan = ApiOutput["billing"]["plans"][number];

export function CurrentSubscription({
  plans,
  activeSubscription,
  className,
}: {
  plans: SubscriptionPlan[];
  activeSubscription?: ApiOutput["team"]["subscription"];
  className?: string;
}) {
  const format = useFormatter();
  const t = useTranslations();
  const localeCurrency = useLocaleCurrency();

  const freePlan: SubscriptionPlan = {
    id: "free",
    name: t("settings.billing.subscription.freePlan.title"),
    variants: [
      {
        id: "free",
        interval_count: 1,
        price: 0,
        interval: "month",
        currency: localeCurrency,
      },
    ],
  };

  const hasActiveSubscription =
    activeSubscription?.status &&
    !["expired", "cancelled"].includes(activeSubscription.status);

  const hasCancelledSubscription = activeSubscription?.status === "cancelled";

  const activePlanId = hasActiveSubscription
    ? activeSubscription.plan_id
    : "free";
  const activeVariantId = hasActiveSubscription
    ? activeSubscription.variant_id
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
        <h4 className="text-primary text-lg font-bold">
          <span>{subscriptionPlan.name} </span>
          <small>
            (
            {format.number(subscriptionVariant.price / 100, {
              style: "currency",
              currency: subscriptionVariant.currency,
            })}
            /
            {t(
              `settings.billing.subscription.${subscriptionVariant.interval}` as any,
            )}
            )
          </small>
        </h4>
        {activeSubscription?.status && (
          <Badge
            status={
              ["on_trial", "active"].includes(activeSubscription.status)
                ? "success"
                : "error"
            }
          >
            {t(
              `settings.billing.subscription.status.${activeSubscription.status}` as any,
            )}
          </Badge>
        )}
      </div>

      {activeSubscription?.next_payment_date && (
        <p className="text-muted-foreground mt-1">
          {t.rich(
            !hasActiveSubscription
              ? "settings.billing.subscription.endsOn"
              : "settings.billing.subscription.nextPayment",
            {
              nextPaymentDate: activeSubscription.next_payment_date,
              strong: (text) => <strong>{text}</strong>,
            },
          )}
        </p>
      )}

      {(activeSubscription ||
        hasActiveSubscription ||
        hasCancelledSubscription) && (
        <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t px-6 py-3">
          <div className="flex w-full flex-col justify-between gap-3 md:flex-row">
            <div>
              {activeSubscription && (
                <Button asChild variant="ghost" className="w-full md:w-auto">
                  <a
                    href={`/billing/customer-portal?subscriptionId=${activeSubscription?.id}`}
                  >
                    <Icon.creditCard className="mr-2 h-4 w-4" />
                    {t("settings.billing.subscription.updateBillingDetails")}
                  </a>
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {hasActiveSubscription && (
                <CancelSubscriptionButton
                  id={activeSubscription.id}
                  label={t("settings.billing.subscription.cancel")}
                />
              )}
              {hasCancelledSubscription && (
                <ResumeSubscriptionButton
                  id={activeSubscription.id}
                  label={t("settings.billing.subscription.resume")}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ActionBlock>
  );
}
