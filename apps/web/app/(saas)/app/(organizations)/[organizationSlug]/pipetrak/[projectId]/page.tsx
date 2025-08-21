import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project page redirect
 * Redirects users to the dashboard as the default project view
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  
  // Redirect to dashboard as the primary project view
  redirect(`/app/pipetrak/${projectId}/dashboard`);
}