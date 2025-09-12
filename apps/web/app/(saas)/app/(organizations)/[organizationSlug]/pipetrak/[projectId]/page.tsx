import { redirect } from "next/navigation";

interface ProjectPageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

/**
 * Project page redirect
 * Redirects users to the dashboard as the default project view
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
	const { organizationSlug, projectId } = await params;

	// Redirect to dashboard as the primary project view
	redirect(`/app/${organizationSlug}/pipetrak/${projectId}/dashboard`);
}
