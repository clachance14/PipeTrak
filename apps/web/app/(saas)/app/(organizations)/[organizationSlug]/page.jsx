import { getActiveOrganization } from "@saas/auth/lib/server";
import { notFound, redirect } from "next/navigation";
export async function generateMetadata({ params, }) {
    const { organizationSlug } = await params;
    const activeOrganization = await getActiveOrganization(organizationSlug);
    return {
        title: activeOrganization?.name,
    };
}
export default async function OrganizationPage({ params, }) {
    const { organizationSlug } = await params;
    const activeOrganization = await getActiveOrganization(organizationSlug);
    if (!activeOrganization) {
        return notFound();
    }
    // Redirect to PipeTrak projects page since it's the main application
    redirect(`/app/${organizationSlug}/pipetrak`);
}
