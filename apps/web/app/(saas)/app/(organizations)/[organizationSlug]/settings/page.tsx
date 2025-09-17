import { redirect } from "next/navigation";

interface OrganizationSettingsPageProps {
	params: Promise<{
		organizationSlug: string;
	}>;
}

export default async function OrganizationSettingsIndex({
	params,
}: OrganizationSettingsPageProps) {
	const { organizationSlug } = await params;

	redirect(`/app/${organizationSlug}/settings/general`);
}
