import { config } from "@repo/config";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import OrganizationStart from "@saas/organizations/components/OrganizationStart";
import { PageHeader } from "@saas/shared/components/PageHeader";
import UserStart from "@saas/start/UserStart";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const activeOrganization = config.organizations.enable
		? await getActiveOrganization()
		: null;

	const t = await getTranslations();

	return (
		<div className="">
			<PageHeader
				title={
					activeOrganization
						? activeOrganization.name
						: t("start.welcome", { name: session?.user.name })
				}
				subtitle={
					activeOrganization
						? t("organizations.start.subtitle")
						: t("start.subtitle")
				}
			/>
			{config.organizations.enable && activeOrganization ? (
				<OrganizationStart />
			) : (
				<UserStart />
			)}
		</div>
	);
}
