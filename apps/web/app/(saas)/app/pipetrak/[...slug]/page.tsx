import { getSession, getOrganizationList } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

interface PipeTrakRedirectPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function PipeTrakRedirectPage({ params }: PipeTrakRedirectPageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/login");
  }

  // Get user's organizations to determine correct redirect path
  const organizations = await getOrganizationList();
  
  // Find active organization or use the first one
  const activeOrganization = organizations.find(
    (org) => org.id === session.session.activeOrganizationId
  ) || organizations[0];

  if (!activeOrganization) {
    // If no organization, redirect to create one
    redirect("/new-organization");
  }

  const { slug } = await params;
  
  // Reconstruct the path with the proper organization slug
  const redirectPath = `/app/${activeOrganization.slug}/pipetrak/${slug.join('/')}`;
  
  redirect(redirectPath);
}