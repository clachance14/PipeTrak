import { redirect } from "next/navigation";
/**
 * Project page redirect
 * Redirects users to the dashboard as the default project view
 */
export default async function ProjectPage({ params }) {
    const { organizationSlug, projectId } = await params;
    // Redirect to dashboard as the primary project view
    redirect(`/app/${organizationSlug}/pipetrak/${projectId}/dashboard`);
}
