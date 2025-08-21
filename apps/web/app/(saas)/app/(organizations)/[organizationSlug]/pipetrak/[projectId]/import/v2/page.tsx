import { notFound } from "next/navigation";
import { getSession } from "@saas/auth/lib/server";
import { db as prisma } from "@repo/database";
import { ImportWizard } from "@pipetrak/import";

interface ImportV2PageProps {
  params: Promise<{
    organizationSlug: string;
    projectId: string;
  }>;
}

export default async function ImportV2Page({ params }: ImportV2PageProps) {
  const { organizationSlug, projectId } = await params;
  
  // Check authentication
  const session = await getSession();
  if (!session) {
    notFound();
  }

  // Verify user has access to the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organization: {
        slug: organizationSlug,
        members: {
          some: {
            userId: session.user.id,
            role: { in: ["owner", "admin", "member"] }
          }
        }
      }
    },
    select: {
      id: true,
      jobName: true
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Components - V2</h1>
        <p className="text-muted-foreground">Project: {project.jobName}</p>
      </div>
      
      <ImportWizard projectId={projectId} />
    </div>
  );
}