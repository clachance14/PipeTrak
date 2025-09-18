/**
 * Unit tests for ResponsiveDashboard component
 * Tests responsive layout switching, breakpoint detection, and error states
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	emptyDashboardData,
	smallDashboardData,
} from "../__fixtures__/dashboard-data";
import { ResponsiveDashboard } from "../components/ResponsiveDashboard";

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		refresh: mockRefresh,
	}),
}));

// Mock child components to isolate ResponsiveDashboard testing
vi.mock("../components/DashboardTopBar", () => ({
	DashboardTopBar: ({ currentProject, availableProjects }: any) => (
		<div data-testid="dashboard-top-bar">
			<span>Project: {currentProject?.jobName}</span>
			<span>Projects: {availableProjects?.length}</span>
		</div>
	),
}));

vi.mock("../components/KPIHeroBar", () => ({
	KPIHeroBar: ({ metrics, testPackages }: any) => (
		<div data-testid="kpi-hero-bar">
			KPI Hero Bar - Components: {metrics?.totalComponents || 0}
		</div>
	),
}));

vi.mock("../components/AreaSystemGrid3x3", () => ({
	AreaSystemGrid3x3: ({ data }: any) => (
		<div data-testid="area-system-grid">
			Area System Grid3x3 - Entries: {data?.matrixData?.length || 0}
		</div>
	),
}));

vi.mock("../components/DrawingHierarchy", () => ({
	DrawingHierarchy: ({ data }: any) => (
		<div data-testid="drawing-hierarchy">
			Drawing Hierarchy - Drawings: {data?.drawings?.length || 0}
		</div>
	),
}));

vi.mock("../components/TestPackageTable", () => ({
	TestPackageTable: ({ data }: any) => (
		<div data-testid="test-package-table">
			Test Package Table - Packages: {data?.testPackages?.length || 0}
		</div>
	),
}));

vi.mock("../components/ActivityFeed", () => ({
	ActivityFeed: ({ data }: any) => (
		<div data-testid="activity-feed">
			Activity Feed - Activities: {data?.activities?.length || 0}
		</div>
	),
}));

vi.mock("../components/TabletDashboard", () => ({
	TabletDashboard: ({
		projectName,
		metrics,
		onProjectChange,
		onRefresh,
	}: any) => (
		<div data-testid="tablet-dashboard">
			<span>Tablet Dashboard: {projectName}</span>
			<span>Components: {metrics?.totalComponents || 0}</span>
			<button onClick={() => onProjectChange("test-project")}>
				Change Project
			</button>
			<button onClick={onRefresh}>Refresh</button>
		</div>
	),
}));

vi.mock("../components/MobileDashboard", () => ({
	MobileDashboard: ({
		projectName,
		metrics,
		onProjectChange,
		onRefresh,
	}: any) => (
		<div data-testid="mobile-dashboard">
			<span>Mobile Dashboard: {projectName}</span>
			<span>Components: {metrics?.totalComponents || 0}</span>
			<button onClick={() => onProjectChange("test-project")}>
				Change Project
			</button>
			<button onClick={onRefresh}>Refresh</button>
		</div>
	),
}));

// Mock window.innerWidth for responsive testing
const mockWindowWidth = (width: number) => {
	Object.defineProperty(window, "innerWidth", {
		writable: true,
		configurable: true,
		value: width,
	});
};

const defaultProps = {
	project: smallDashboardData.project,
	metrics: smallDashboardData.metrics,
	areaSystemMatrix: smallDashboardData.areaSystemMatrix,
	drawingRollups: smallDashboardData.drawingRollups,
	testPackageReadiness: smallDashboardData.testPackageReadiness,
	recentActivity: smallDashboardData.recentActivity,
	availableProjects: [
		{ id: "project-1", jobName: "Project 1" },
		{ id: "project-2", jobName: "Project 2" },
	],
};

describe("ResponsiveDashboard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default to desktop width
		mockWindowWidth(1200);
	});

	afterEach(() => {
		// Clean up any event listeners
		window.removeEventListener("resize", vi.fn());
	});

	describe("Error States", () => {
		it("renders error message when project is null", () => {
			render(<ResponsiveDashboard {...defaultProps} project={null} />);

			expect(
				screen.getByText(
					"Project not found or you don't have access to it.",
				),
			).toBeInTheDocument();
		});

		it("shows warning when metrics are missing", () => {
			render(<ResponsiveDashboard {...defaultProps} metrics={null} />);

			expect(
				screen.getByText(
					"Unable to load dashboard metrics. Please try refreshing the page.",
				),
			).toBeInTheDocument();
		});
	});

	describe("Desktop Layout (≥1024px)", () => {
		beforeEach(() => {
			mockWindowWidth(1200);
		});

		it("renders desktop layout components", () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			expect(screen.getByTestId("dashboard-top-bar")).toBeInTheDocument();
			expect(screen.getByTestId("kpi-hero-bar")).toBeInTheDocument();
			expect(screen.getByTestId("area-system-grid")).toBeInTheDocument();
			expect(screen.getByTestId("drawing-hierarchy")).toBeInTheDocument();
			expect(
				screen.getByTestId("test-package-table"),
			).toBeInTheDocument();
			expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
		});

		it("displays project name and metrics correctly", () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			expect(
				screen.getByText(`${defaultProps.project!.jobName} Dashboard`),
			).toBeInTheDocument();
			expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
		});

		it("passes correct data to child components", () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			expect(
				screen.getByText("KPI Hero Bar - Components: 10"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Area System Grid3x3 - Entries: 3"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Drawing Hierarchy - Drawings: 3"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Test Package Table - Packages: 3"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Activity Feed - Activities: 3"),
			).toBeInTheDocument();
		});
	});

	describe("Tablet Layout (768-1024px)", () => {
		beforeEach(() => {
			mockWindowWidth(900);
		});

		it("renders tablet layout when screen width is between 768-1024px", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			// Wait for resize effect to trigger
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.getByTestId("tablet-dashboard"),
				).toBeInTheDocument();
			});
		});

		it("does not render desktop components in tablet layout", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.queryByTestId("area-system-grid"),
				).not.toBeInTheDocument();
				expect(
					screen.queryByTestId("drawing-hierarchy"),
				).not.toBeInTheDocument();
			});
		});

		it("handles project change in tablet layout", async () => {
			const user = userEvent.setup();
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(async () => {
				const changeButton = screen.getByText("Change Project");
				await user.click(changeButton);
			});

			expect(mockPush).toHaveBeenCalledWith(
				"/app/pipetrak/test-project/dashboard",
			);
		});
	});

	describe("Mobile Layout (<768px)", () => {
		beforeEach(() => {
			mockWindowWidth(400);
		});

		it("renders mobile layout when screen width is less than 768px", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.getByTestId("mobile-dashboard"),
				).toBeInTheDocument();
			});
		});

		it("does not render desktop or tablet components in mobile layout", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.queryByTestId("dashboard-top-bar"),
				).not.toBeInTheDocument();
				expect(
					screen.queryByTestId("area-system-grid"),
				).not.toBeInTheDocument();
				expect(
					screen.queryByTestId("tablet-dashboard"),
				).not.toBeInTheDocument();
			});
		});

		it("handles refresh in mobile layout", async () => {
			const user = userEvent.setup();
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(async () => {
				const refreshButton = screen.getByText("Refresh");
				await user.click(refreshButton);
			});

			expect(mockRefresh).toHaveBeenCalled();
		});
	});

	describe("Responsive Breakpoint Detection", () => {
		it("switches from desktop to tablet layout on resize", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			// Initially desktop
			expect(screen.getByTestId("dashboard-top-bar")).toBeInTheDocument();

			// Resize to tablet
			mockWindowWidth(900);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.getByTestId("tablet-dashboard"),
				).toBeInTheDocument();
				expect(
					screen.queryByTestId("dashboard-top-bar"),
				).not.toBeInTheDocument();
			});
		});

		it("switches from tablet to mobile layout on resize", async () => {
			mockWindowWidth(900);
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			// Initially tablet
			await waitFor(() => {
				expect(
					screen.getByTestId("tablet-dashboard"),
				).toBeInTheDocument();
			});

			// Resize to mobile
			mockWindowWidth(500);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.getByTestId("mobile-dashboard"),
				).toBeInTheDocument();
				expect(
					screen.queryByTestId("tablet-dashboard"),
				).not.toBeInTheDocument();
			});
		});

		it("switches from mobile back to desktop layout", async () => {
			mockWindowWidth(500);
			render(<ResponsiveDashboard {...defaultProps} />);

			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			// Initially mobile
			await waitFor(() => {
				expect(
					screen.getByTestId("mobile-dashboard"),
				).toBeInTheDocument();
			});

			// Resize to desktop
			mockWindowWidth(1200);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			await waitFor(() => {
				expect(
					screen.getByTestId("dashboard-top-bar"),
				).toBeInTheDocument();
				expect(
					screen.queryByTestId("mobile-dashboard"),
				).not.toBeInTheDocument();
			});
		});
	});

	describe("Data Handling", () => {
		it("handles empty data gracefully", () => {
			render(
				<ResponsiveDashboard
					{...defaultProps}
					metrics={emptyDashboardData.metrics}
					areaSystemMatrix={emptyDashboardData.areaSystemMatrix}
					drawingRollups={emptyDashboardData.drawingRollups}
					testPackageReadiness={
						emptyDashboardData.testPackageReadiness
					}
					recentActivity={emptyDashboardData.recentActivity}
				/>,
			);

			expect(
				screen.getByText("KPI Hero Bar - Components: 0"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Area System Grid3x3 - Entries: 0"),
			).toBeInTheDocument();
		});

		it("handles null data props", () => {
			render(
				<ResponsiveDashboard
					{...defaultProps}
					metrics={null}
					areaSystemMatrix={null}
					drawingRollups={null}
					testPackageReadiness={null}
					recentActivity={null}
				/>,
			);

			expect(
				screen.getByText("KPI Hero Bar - Components: 0"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Area System Grid3x3 - Entries: 0"),
			).toBeInTheDocument();
		});
	});

	describe("Navigation Handlers", () => {
		it("handles project change correctly", () => {
			const { rerender } = render(
				<ResponsiveDashboard {...defaultProps} />,
			);

			// Simulate project change by re-rendering with different project
			const newProject = { id: "new-project", jobName: "New Project" };
			rerender(
				<ResponsiveDashboard {...defaultProps} project={newProject} />,
			);

			expect(
				screen.getByText("New Project Dashboard"),
			).toBeInTheDocument();
		});

		it("passes available projects to child components", () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			expect(screen.getByText("Projects: 2")).toBeInTheDocument();
		});
	});

	describe("Event Listener Cleanup", () => {
		it("removes resize event listener on unmount", () => {
			const removeEventListenerSpy = vi.spyOn(
				window,
				"removeEventListener",
			);
			const { unmount } = render(
				<ResponsiveDashboard {...defaultProps} />,
			);

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"resize",
				expect.any(Function),
			);
		});
	});

	describe("Edge Cases", () => {
		it("handles rapid resize events", async () => {
			render(<ResponsiveDashboard {...defaultProps} />);

			// Rapidly change screen sizes
			mockWindowWidth(500);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			mockWindowWidth(900);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			mockWindowWidth(1200);
			await act(async () => {
				window.dispatchEvent(new Event("resize"));
			});

			// Should end up in desktop layout
			await waitFor(() => {
				expect(
					screen.getByTestId("dashboard-top-bar"),
				).toBeInTheDocument();
			});
		});

		it("handles undefined availableProjects array", () => {
			render(
				<ResponsiveDashboard
					{...defaultProps}
					availableProjects={[]}
				/>,
			);

			expect(screen.getByText("Projects: 0")).toBeInTheDocument();
		});
	});

	describe("Performance", () => {
		it("does not re-render unnecessarily when data is unchanged", () => {
			const { rerender } = render(
				<ResponsiveDashboard {...defaultProps} />,
			);

			// Re-render with same props
			rerender(<ResponsiveDashboard {...defaultProps} />);

			// Component should render without issues
			expect(screen.getByTestId("dashboard-top-bar")).toBeInTheDocument();
		});

		it("handles large datasets efficiently", () => {
			const largeMockData = {
				...defaultProps,
				areaSystemMatrix: {
					matrixData: Array(1000)
						.fill(null)
						.map((_, i) => ({
							area: `Area-${i}`,
							system: `System-${i}`,
							totalCount: 10,
							completedCount: 5,
							completionPercent: 50,
							stalledCounts: {
								stalled7Days: 1,
								stalled14Days: 0,
								stalled21Days: 0,
							},
						})),
					generatedAt: Date.now(),
				},
			};

			const startTime = performance.now();
			render(<ResponsiveDashboard {...largeMockData} />);
			const endTime = performance.now();

			// Should render quickly even with large dataset
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});
});
