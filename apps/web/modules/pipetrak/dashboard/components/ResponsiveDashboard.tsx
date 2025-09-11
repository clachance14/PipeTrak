"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentWithMilestones } from "../../types";
import { fetchDashboardComponentsClient } from "../lib/client-api";
import type {
	DashboardMetrics,
	DrawingRollups,
	RecentActivity,
	TestPackageReadiness,
} from "../types";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardTopBar } from "./DashboardTopBar";
import { DrawingHierarchy } from "./DrawingHierarchy";
import { KPIHeroBar } from "./KPIHeroBar";
import { MilestoneProgressMatrix } from "./MilestoneProgressMatrix";
import { MobileDashboard } from "./MobileDashboard";
import { TabletDashboard } from "./TabletDashboard";
import { TestPackageTable } from "./TestPackageTable";

interface ResponsiveDashboardProps {
	project: {
		id: string;
		jobName: string;
		description: string | null;
		status: string;
		organizationId: string;
	} | null;
	metrics: DashboardMetrics | null;
	drawingRollups: DrawingRollups | null;
	testPackageReadiness: TestPackageReadiness | null;
	recentActivity: RecentActivity | null;
	availableProjects: Array<{ id: string; jobName: string }>;
}

/**
 * Responsive Dashboard - Layout orchestrator
 * Detects screen size and renders appropriate layout:
 * - Desktop (≥1024px): Full analytics dashboard
 * - Tablet (768-1024px): Update-first layout with component list
 * - Mobile (<768px): Simplified touch-first interface
 */
export function ResponsiveDashboard({
	project,
	metrics,
	drawingRollups,
	testPackageReadiness,
	recentActivity,
	availableProjects,
}: ResponsiveDashboardProps) {
	const router = useRouter();
	const [screenSize, setScreenSize] = useState<
		"mobile" | "tablet" | "desktop"
	>("desktop");
	const [components, setComponents] = useState<ComponentWithMilestones[]>([]);
	const [loadingComponents, setLoadingComponents] = useState(false);

	// Detect screen size
	useEffect(() => {
		const checkScreenSize = () => {
			const width = window.innerWidth;
			if (width < 768) {
				setScreenSize("mobile");
			} else if (width < 1024) {
				setScreenSize("tablet");
			} else {
				setScreenSize("desktop");
			}
		};

		// Check on mount
		checkScreenSize();

		// Listen for resize events
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	// Load components for milestone matrix
	useEffect(() => {
		if (project?.id) {
			loadComponents();
		}
	}, [project?.id]);

	const loadComponents = async () => {
		if (!project?.id) {
			return;
		}

		setLoadingComponents(true);
		try {
			const result = await fetchDashboardComponentsClient(
				project.id,
				{},
				500,
				0,
			);
			setComponents(result.components);
		} catch (error) {
			console.error("Error loading components:", error);
		} finally {
			setLoadingComponents(false);
		}
	};

	const handleProjectChange = (projectId: string) => {
		router.push(`/app/pipetrak/${projectId}/dashboard`);
	};

	const handleRefresh = () => {
		router.refresh();
	};

	if (!project) {
		return (
			<Alert>
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>
					Project not found or you don't have access to it.
				</AlertDescription>
			</Alert>
		);
	}

	// Mobile Layout (<768px)
	if (screenSize === "mobile") {
		return (
			<MobileDashboard
				projectId={project.id}
				projectName={project.jobName}
				metrics={metrics}
				testPackageReadiness={testPackageReadiness}
				onProjectChange={handleProjectChange}
				onRefresh={handleRefresh}
				availableProjects={availableProjects}
			/>
		);
	}

	// Tablet Layout (768-1024px)
	if (screenSize === "tablet") {
		return (
			<TabletDashboard
				projectId={project.id}
				projectName={project.jobName}
				metrics={metrics}
				testPackageReadiness={testPackageReadiness}
				onProjectChange={handleProjectChange}
				onRefresh={handleRefresh}
				availableProjects={availableProjects}
			/>
		);
	}

	// Desktop Layout (≥1024px) - Full Analytics Dashboard
	return (
		<div className="space-y-6">
			{/* Top Bar with Controls */}
			<DashboardTopBar />

			{/* KPI Hero Bar */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold tracking-tight">
						Dashboard
					</h1>
					{metrics && (
						<p className="text-sm text-muted-foreground">
							Last updated:{" "}
							{new Date(metrics.generatedAt).toLocaleString()}
						</p>
					)}
				</div>

				<KPIHeroBar
					metrics={metrics}
					testPackages={testPackageReadiness}
				/>
			</div>

			{/* Interactive Dashboard Components */}
			<div className="space-y-6">
				{/* Milestone Progress Matrix - Full width */}
				<MilestoneProgressMatrix
					components={components}
					showSystems={true}
					showTestPackages={true}
					loading={loadingComponents}
				/>

				{/* Two-column layout for Drawing Hierarchy and Test Package Readiness */}
				<div className="grid gap-6 lg:grid-cols-2">
					<DrawingHierarchy data={drawingRollups} />
					<TestPackageTable data={testPackageReadiness} />
				</div>

				{/* Activity Feed - Full width */}
				<ActivityFeed data={recentActivity} />
			</div>

			{/* Error States */}
			{!metrics && (
				<Alert>
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Unable to load dashboard metrics. Please try refreshing
						the page.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
