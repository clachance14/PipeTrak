"use client";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@ui/components/card";
import { Alert, AlertDescription } from "@ui/components/alert";
import { PlusIcon, Folder, MapPin, Calendar, BarChart3, AlertCircle, Building2, Loader2, } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateProjectModal } from "@pipetrak/projects/CreateProjectModal";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
export default function PipeTrakPage() {
    const router = useRouter();
    const { session } = useSession();
    const { activeOrganization, loaded: orgLoaded } = useActiveOrganization();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    useEffect(() => {
        if (!session) {
            router.push("/auth/login");
            return;
        }
        if (orgLoaded && activeOrganization) {
            fetchProjects();
        }
    }, [session, orgLoaded, activeOrganization]);
    const fetchProjects = async () => {
        if (!activeOrganization) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`/api/pipetrak/projects?organizationId=${activeOrganization.id}`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        }
        catch (error) {
            console.error("Error fetching projects:", error);
        }
        finally {
            setLoading(false);
        }
    };
    if (!orgLoaded || loading) {
        return (<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
			</div>);
    }
    if (!activeOrganization) {
        // This shouldn't happen since requireOrganization is true
        return (<div className="space-y-8">
				<PageHeader title="PipeTrak Projects" subtitle="Select a project to manage components and track progress"/>
				<Alert>
					<AlertCircle className="h-4 w-4"/>
					<AlertDescription>
						Unable to determine organization context. Please contact
						support.
					</AlertDescription>
				</Alert>
			</div>);
    }
    return (<div className="space-y-8">
			<PageHeader title="PipeTrak Projects" subtitle={`Manage construction projects for ${activeOrganization.name}`}/>

			{projects.length === 0 ? (<div className="space-y-6">
					<Alert>
						<AlertCircle className="h-4 w-4"/>
						<AlertDescription>
							No projects found. Create your first project to get
							started with PipeTrak.
						</AlertDescription>
					</Alert>

					<Card>
						<CardHeader>
							<CardTitle>Get Started with PipeTrak</CardTitle>
							<CardDescription>
								Create a new project for{" "}
								{activeOrganization.name}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button className="w-full sm:w-auto" onClick={() => setShowCreateModal(true)}>
								<PlusIcon className="h-4 w-4 mr-2"/>
								Create New Project
							</Button>
							<div className="text-sm text-muted-foreground">
								<p className="font-mono bg-muted p-2 rounded">
									pnpm --filter scripts seed-sdo-tank
								</p>
								<p className="mt-2">
									Run this command to seed the SDO Tank sample
									project
								</p>
							</div>
						</CardContent>
					</Card>
				</div>) : (<div className="space-y-6">
					<div className="flex justify-between items-center">
						<h2 className="text-lg font-semibold">
							Active Projects
						</h2>
						<Button onClick={() => setShowCreateModal(true)}>
							<PlusIcon className="h-4 w-4 mr-2"/>
							New Project
						</Button>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (<Card key={project.id} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Folder className="h-5 w-5"/>
										{project.jobName}
									</CardTitle>
									<CardDescription>
										Job #{project.jobNumber}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2 text-sm">
										{project.client && (<div className="flex items-center gap-2 text-muted-foreground">
												<Building2 className="h-4 w-4"/>
												<span>{project.client}</span>
											</div>)}
										<div className="flex items-center gap-2 text-muted-foreground">
											<MapPin className="h-4 w-4"/>
											<span>
												{project.location ||
                    "No location"}
											</span>
										</div>
										<div className="flex items-center gap-2 text-muted-foreground">
											<Calendar className="h-4 w-4"/>
											<span>
												{project.targetDate
                    ? new Date(project.targetDate).toLocaleDateString()
                    : "No target date"}
											</span>
										</div>
										<div className="flex items-center gap-2 text-muted-foreground">
											<BarChart3 className="h-4 w-4"/>
											<span>
												{project._count.components}{" "}
												components,{" "}
												{project._count.drawings}{" "}
												drawings
											</span>
										</div>
									</div>

									<div className="flex flex-col gap-2">
										<Button asChild className="w-full">
											<Link href={`/app/${activeOrganization.slug}/pipetrak/${project.id}/dashboard`}>
												Open Dashboard
											</Link>
										</Button>
										<div className="grid grid-cols-2 gap-2">
											<Button variant="outline" size="sm">
												<Link href={`/app/${activeOrganization.slug}/pipetrak/${project.id}/components`}>
													Components
												</Link>
											</Button>
											<Button variant="outline" size="sm">
												<Link href={`/app/${activeOrganization.slug}/pipetrak/${project.id}/import`}>
													Import
												</Link>
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>))}
					</div>
				</div>)}

			<CreateProjectModal open={showCreateModal} onOpenChange={setShowCreateModal}/>
		</div>);
}
