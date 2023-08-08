import { Badge, Button, Icon } from "@components";
import { Subscription, SubscriptionPlan } from "billing/subscriptions";
import { useFormatter, useTranslations } from "next-intl";
import CancelSubscriptionButton from "./CancelSubscriptionButton";

export default function CurrentSubscription({
  plans,
  userSubscription,
  className,
}: {
  plans: SubscriptionPlan[];
  userSubscription?: Subscription;
  className?: string;
}) {
  const format = useFormatter();
  const t = useTranslations("settings.billing");

  const freePlan: SubscriptionPlan = {
    id: "free",
    name: t("subscription.freePlan.title"),
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

  const activePlanId = hasActiveSubscription ? userSubscription.planId : "free";
  const activeVariantId = hasActiveSubscription
    ? userSubscription.variantId
    : "free";

  const subscriptionPlan = [freePlan, ...plans].find(
    (plan) => plan.id === activePlanId,
  );
  const subscriptionVariant = subscriptionPlan?.variants.find(
    (variant) => variant.id === activeVariantId,
  );

  return (
    <div className={`${className}`}>
      <div className="bg-primary-500/10 rounded-xl p-6">
        <div className="">
          <div>
            <h2 className="mb-3 text-2xl font-semibold">
              {t("subscription.currentSubscription")}
            </h2>

            <div className="flex items-center gap-2">
              <h4 className="text-primary-800 dark:text-primary-200 text-xl">
                <span>{subscriptionPlan.name} </span>
                <small>
                  (
                  {format.number(subscriptionVariant.price / 100, {
                    style: "currency",
                    currency: subscriptionPlan.currency,
                  })}
                  /{t(`subscription.${subscriptionVariant.interval}` as any)})
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
                  {t(`subscription.status.${userSubscription.status}` as any)}
                </Badge>
              )}
            </div>

            {userSubscription?.nextPaymentDate && (
              <p className="mt-1 text-zinc-500">
                {t.rich(
                  !hasActiveSubscription
                    ? "subscription.endsOn"
                    : "subscription.nextPayment",
                  {
                    nextPaymentDate: userSubscription.nextPaymentDate,
                    strong: (text) => <strong>{text}</strong>,
                  },
                )}
              </p>
            )}

            {hasActiveSubscription && (
              <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t px-6 py-3 dark:border-zinc-800">
                <div className="flex w-full flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <Button
                      as="a"
                      href={`/billing/customer-portal?subscriptionId=${userSubscription.subscriptionId}`}
                      intent="primary-ghost"
                      size="small"
                      className="w-full md:w-auto"
                    >
                      <Icon.creditCard className="h-4 w-4" />
                      {t("subscription.updateBillingDetails")}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row">
                    {hasActiveSubscription && (
                      <CancelSubscriptionButton
                        subscriptionId={userSubscription.subscriptionId}
                        label={t("subscription.cancel")}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
