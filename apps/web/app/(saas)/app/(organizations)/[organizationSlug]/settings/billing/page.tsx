import { getActiveOrganization } from "@saas/auth/lib/server";
import { PurchasesOverview } from "@saas/settings/components/PurchasesOverview";
import { UpgradePlan } from "@saas/settings/components/UpgradePlan";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.billing.title"),
	};
}

export default async function BillingSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	return (
		<>
			<PurchasesOverview className="mb-4" />
			<UpgradePlan activeOrganizationId={organization.id} />
		</>
	);
}
