import Button from '@common/components/primitives/Button';
import { Subscription } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { SubscriptionPlan } from '../types';

export default async function CurrentSubscription({
  plans,
  userSubscription,
  className,
}: {
  plans: SubscriptionPlan[];
  userSubscription: Subscription;
  className?: string;
}) {
  const t = await getTranslations('settings.billing');
  const userSubscriptionPlan = plans.find((plan) => plan.id === userSubscription?.planId);
  const userSubscriptionVariant = userSubscriptionPlan?.variants.find(
    (variant) => variant.id === userSubscription?.variantId
  );

  if (!userSubscriptionPlan || !userSubscriptionVariant) return null;

  return (
    <div className={`${className}`}>
      <div className="rounded-xl bg-zinc-50 p-6 dark:bg-zinc-800">
        <div className="flex items-start justify-between">
          <div className="">
            <h3 className="text-small mb-2 font-semibold opacity-50">{t('subscription.currentSubscription')}</h3>
            <h4 className="text-xl font-bold">
              <span className="text-blue-500">{userSubscriptionPlan.name} </span>
              <small>
                (
                {Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: userSubscriptionPlan.currency,
                }).format(userSubscriptionVariant.price / 100)}
                /{t(`subscription.${userSubscriptionVariant.interval}` as any)})
              </small>
            </h4>

            <p className="mt-1">
              {t.rich('subscription.nextPayment', {
                date: Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                }).format(new Date()),
                // @ts-ignore
                strong: (text: string) => <strong>{text}</strong>,
              })}
            </p>

            <div className="flex gap-4">
              <Button intent="primary-ghost" size="small" className="mt-4">
                {t('subscription.cancel')}
              </Button>
              <Button intent="primary-ghost" size="small" className="mt-4">
                {t('subscription.pauseSubscription')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-sm leading-tight ${
                ['on_trial', 'active'].includes(userSubscription.status)
                  ? 'bg-emerald-500 bg-opacity-10 text-emerald-500'
                  : 'bg-rose-500 bg-opacity-10 text-rose-500'
              }`}
            >
              {t(`subscription.status.${userSubscription.status}` as any)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
