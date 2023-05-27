'use client';

import { Button, Icon } from '@ui/components';
import { useRouter } from 'next/navigation';
import { trpc } from '../../../trpc/client';

export default function CancelSubscriptionButton({ subscriptionId, label }: { subscriptionId: string; label: string }) {
  const router = useRouter();
  const cancelSubscriptionMutation = trpc.cancelSubscription.useMutation();

  const cancelSubscription = async () => {
    await cancelSubscriptionMutation.mutateAsync({ subscriptionId });
    router.refresh();
  };

  return (
    <Button
      intent="primary-outline"
      isLoading={cancelSubscriptionMutation.isLoading}
      size="small"
      onClick={() => cancelSubscription()}
    >
      <Icon.close className="h-4 w-4" />
      {label}
    </Button>
  );
}
