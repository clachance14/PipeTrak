'use client';

import Button from '@common/components/primitives/Button';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';
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
      <FiX />
      {label}
    </Button>
  );
}
