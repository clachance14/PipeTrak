import { getSession, getOrganizationList } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	// Get user's organizations to determine correct redirect path
	const organizations = await getOrganizationList();

	// Find active organization or use the first one
	const activeOrganization =
		organizations.find(
			(org) => org.id === session.session.activeOrganizationId,
		) || organizations[0];

	if (!activeOrganization) {
		// If no organization, redirect to create one
		redirect("/new-organization");
	}

	// Redirect to organization home page
	redirect(`/app/${activeOrganization.slug}`);
}
