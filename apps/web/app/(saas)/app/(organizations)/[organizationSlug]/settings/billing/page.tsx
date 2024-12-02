import { getActiveOrganization } from "@saas/auth/lib/server";
import { PurchasesOverview } from "@saas/settings/components/PurchasesOverview";
import { UpgradePlan } from "@saas/settings/components/UpgradePlan";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.billing.title"),
	};
}

export default async function BillingSettingsPage() {
	const organization = await getActiveOrganization();

	if (!organization) {
		return null;
	}

	return (
		<>
			<PurchasesOverview className="mb-4" />
			<UpgradePlan activeOrganizationId={organization.id} />
		</>
	);
}
