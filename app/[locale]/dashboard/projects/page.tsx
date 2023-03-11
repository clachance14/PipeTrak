import { PageHeader } from '@dashboard/components/PageHeader';
import ProjectTable from '@projects/components/ProjectTable';
import { getProjects } from '@projects/server';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <PageHeader title="Projects" subtitle="Manage your projects" />

      <div className="container py-6">
        <ProjectTable projects={projects} />
      </div>
    </div>
  );
}
