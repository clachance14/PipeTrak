"use client";

import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useTranslations } from "next-intl";

export function UpgradePlan({
	activeOrganizationId,
}: { activeOrganizationId?: string }) {
	const t = useTranslations();

	return (
		<ActionBlock title={t("settings.billing.subscription.upgradePlan")}>
			{/* <PricingTable activeOrganizationId={activeOrganizationId} /> */}
		</ActionBlock>
	);
}
