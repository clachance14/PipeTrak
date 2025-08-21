"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Button } from "@ui/components/button";
import { Plus, FolderOpen } from "lucide-react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { CreateProjectModal } from "./CreateProjectModal";

interface Project {
  id: string;
  jobNumber: string;
  jobName: string;
  client: string | null;
}

export function ProjectSwitcher() {
  const params = useParams();
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const projectId = params.projectId as string;

  useEffect(() => {
    if (activeOrganization) {
      fetchProjects();
    }
  }, [activeOrganization, projectId]);

  const fetchProjects = async () => {
    if (!activeOrganization) return;

    try {
      const response = await fetch(`/api/pipetrak/projects?organizationId=${activeOrganization.id}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        
        // Set current project
        const current = data.find((p: Project) => p.id === projectId);
        setCurrentProject(current || null);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId === "new") {
      setShowCreateModal(true);
    } else if (newProjectId === "all") {
      router.push(`/app/${activeOrganization?.slug}/pipetrak`);
    } else {
      // Navigate to the same page in the new project
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/');
      const projectIndex = pathSegments.indexOf(projectId);
      
      if (projectIndex !== -1) {
        pathSegments[projectIndex] = newProjectId;
        const newPath = pathSegments.join('/');
        router.push(newPath);
      } else {
        // Default to dashboard if can't determine current page
        router.push(`/app/${activeOrganization?.slug}/pipetrak/${newProjectId}/dashboard`);
      }
    }
  };

  if (loading || !currentProject) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <Select value={projectId} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-full max-w-md min-w-0">
            <SelectValue className="block overflow-hidden">
              {currentProject ? (
                <span className="block truncate text-left">
                  {currentProject.jobName} ({currentProject.jobNumber})
                </span>
              ) : (
                "Select Project"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-semibold">
              ← All Projects
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{project.jobName}</span>
                  <span className="text-xs text-muted-foreground">
                    {project.jobNumber} {project.client && `• ${project.client}`}
                  </span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="new" className="text-primary">
              <Plus className="h-4 w-4 mr-2 inline" />
              Create New Project
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}