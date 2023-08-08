"use client";

import { apiClient } from "@supastarter/frontend/shared/api";
import { Button, Icon } from "@supastarter/frontend/web/ui";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton({
  subscriptionId,
  label,
}: {
  subscriptionId: string;
  label: string;
}) {
  const router = useRouter();
  const cancelSubscriptionMutation = apiClient.cancelSubscription.useMutation();

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
