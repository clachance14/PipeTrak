import Button from '@common/components/primitives/Button';
import { Subscription } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { FiCreditCard, FiPause, FiX } from 'react-icons/fi';
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
      <div className="rounded-xl border-2 p-6 dark:border-zinc-800">
        <div className="">
          <div>
            <h2 className="mb-3 text-2xl font-semibold">{t('subscription.currentSubscription')}</h2>

            <div className="flex items-center gap-2">
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

            {userSubscription.nextPaymentDate && (
              <p className="mt-1 text-zinc-500">
                {t.rich('subscription.nextPayment', {
                  date: Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                  }).format(userSubscription.nextPaymentDate),
                  // @ts-ignore
                  strong: (text: string) => <strong>{text}</strong>,
                })}
              </p>
            )}

            <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t px-6 py-3 dark:border-zinc-800">
              <div className="flex w-full flex-col justify-between gap-3 md:flex-row">
                <div className="flex-1">
                  <Button intent="primary-ghost" size="small" className="w-full md:w-auto">
                    <FiCreditCard />
                    {t('subscription.updateBillingDetails')}
                  </Button>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <Button intent="primary-outline" size="small">
                    <FiPause />
                    {t('subscription.pauseSubscription')}
                  </Button>

                  <Button intent="primary-outline" size="small">
                    <FiX />
                    {t('subscription.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
