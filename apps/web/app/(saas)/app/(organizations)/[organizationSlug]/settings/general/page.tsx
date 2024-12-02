import { ChangeOrganizationNameForm } from "@saas/organizations/components/ChangeOrganizationNameForm";
import { DeleteOrganizationForm } from "@saas/organizations/components/DeleteOrganizationForm";
import { OrganizationAvatarForm } from "@saas/organizations/components/OrganizationAvatarForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("organizations.settings.title"),
	};
}

export default function OrganizationSettingsPage() {
	return (
		<div className="grid grid-cols-1 gap-6">
			<OrganizationAvatarForm />
			<ChangeOrganizationNameForm />
			<DeleteOrganizationForm />
		</div>
	);
}
