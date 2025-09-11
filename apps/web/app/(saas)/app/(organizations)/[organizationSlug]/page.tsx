import { getActiveOrganization } from "@saas/auth/lib/server";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	return {
		title: activeOrganization?.name,
	};
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	try {
		const activeOrganization = await getActiveOrganization(
			organizationSlug as string,
		);

		if (!activeOrganization) {
			return notFound();
		}

		// Redirect to PipeTrak projects page since it's the main application
		redirect(`/app/${organizationSlug}/pipetrak`);
	} catch (error) {
		console.error("Error loading organization:", error);
		// If there's a database error, still try to redirect to pipetrak
		// The pipetrak page will handle the organization loading error
		redirect(`/app/${organizationSlug}/pipetrak`);
	}
}
