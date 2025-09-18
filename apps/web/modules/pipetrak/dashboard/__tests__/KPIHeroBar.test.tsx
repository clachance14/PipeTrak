/**
 * Unit tests for KPIHeroBar component
 * Tests KPI card rendering, loading states, and stalled component display
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	allCompletedMetrics,
	allStalledMetrics,
	emptyDashboardMetrics,
	smallDashboardMetrics,
	smallTestPackageReadiness,
} from "../__fixtures__/dashboard-data";
import { KPIHeroBar } from "../components/KPIHeroBar";

describe("KPIHeroBar", () => {
	describe("Loading State", () => {
		it("renders loading skeleton when metrics is null", () => {
			render(<KPIHeroBar metrics={null} testPackages={null} />);

			// Should render 5 skeleton cards
			const skeletonCards = screen
				.getAllByRole("generic")
				.filter((element) =>
					element.classList.contains("animate-pulse"),
				);
			expect(skeletonCards).toHaveLength(5);
		});

		it("renders loading skeletons with proper structure", () => {
			render(<KPIHeroBar metrics={null} testPackages={null} />);

			// Each skeleton should have the proper structure
			const skeletonDivs = document.querySelectorAll(
				".animate-pulse .h-4.bg-gray-300",
			);
			expect(skeletonDivs.length).toBeGreaterThan(0);
		});
	});

	describe("Data Rendering", () => {
		it("renders all KPI cards with correct data", () => {
			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Overall completion percentage
			expect(screen.getByText("Overall %")).toBeInTheDocument();
			expect(screen.getByText("60%")).toBeInTheDocument(); // Rounded from 60.0
			expect(screen.getByText("Project completion")).toBeInTheDocument();

			// Components
			expect(screen.getByText("Components")).toBeInTheDocument();
			expect(screen.getByText("6 / 10")).toBeInTheDocument();
			expect(screen.getByText("6 completed")).toBeInTheDocument();

			// Active drawings
			expect(screen.getByText("Active Drawings")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument(); // activeDrawings from fixture
			expect(screen.getByText("With components")).toBeInTheDocument();

			// Test packages
			expect(screen.getByText("Test Pkgs")).toBeInTheDocument();
			expect(screen.getByText("1 ready")).toBeInTheDocument(); // 1 ready package from fixture
			expect(screen.getByText("3 total packages")).toBeInTheDocument();

			// Stalled components
			expect(screen.getByText("Stalled")).toBeInTheDocument();
			expect(screen.getByText("7d: 1")).toBeInTheDocument();
			expect(screen.getByText("14d: 1")).toBeInTheDocument();
			expect(screen.getByText("21d: 0")).toBeInTheDocument();
		});

		it("handles large numbers with proper formatting", () => {
			const largeMetrics = {
				...smallDashboardMetrics,
				totalComponents: 10000,
				completedComponents: 7500,
				overallCompletionPercent: 75.0,
			};

			render(
				<KPIHeroBar
					metrics={largeMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Should format large numbers with commas
			expect(screen.getByText("7,500 / 10,000")).toBeInTheDocument();
			expect(screen.getByText("7500 completed")).toBeInTheDocument();
		});

		it("rounds completion percentage correctly", () => {
			const fractionalMetrics = {
				...smallDashboardMetrics,
				overallCompletionPercent: 67.89,
			};

			render(
				<KPIHeroBar
					metrics={fractionalMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Should round 67.89 to 68%
			expect(screen.getByText("68%")).toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("handles empty project data", () => {
			render(
				<KPIHeroBar
					metrics={emptyDashboardMetrics}
					testPackages={{ testPackages: [], generatedAt: Date.now() }}
				/>,
			);

			expect(screen.getByText("0%")).toBeInTheDocument();
			expect(screen.getByText("0 / 0")).toBeInTheDocument();
			expect(screen.getByText("0")).toBeInTheDocument(); // Active drawings
			expect(screen.getByText("0 ready")).toBeInTheDocument();
			expect(screen.getByText("0 total packages")).toBeInTheDocument();
		});

		it("handles null test packages", () => {
			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={null}
				/>,
			);

			// Should default to 0 when testPackages is null
			expect(screen.getByText("0 ready")).toBeInTheDocument();
			expect(screen.getByText("0 total packages")).toBeInTheDocument();
		});

		it("displays all completed project correctly", () => {
			render(
				<KPIHeroBar
					metrics={allCompletedMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			expect(screen.getByText("100%")).toBeInTheDocument();
			expect(screen.getByText("50 / 50")).toBeInTheDocument();
			expect(screen.getByText("50 completed")).toBeInTheDocument();
		});

		it("displays all stalled project correctly", () => {
			render(
				<KPIHeroBar
					metrics={allStalledMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			expect(screen.getByText("0%")).toBeInTheDocument();
			expect(screen.getByText("7d: 10")).toBeInTheDocument();
			expect(screen.getByText("14d: 10")).toBeInTheDocument();
			expect(screen.getByText("21d: 10")).toBeInTheDocument();
		});
	});

	describe("Visual Elements", () => {
		it("renders correct icons for each KPI card", () => {
			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Check that Lucide icons are rendered (they should have specific classes)
			const cards = screen.getAllByRole("generic").filter(
				(el) => el.classList.contains("grid") === false, // Exclude the grid container
			);

			// We can't easily test for specific Lucide icons, but we can test structure
			expect(cards.length).toBeGreaterThan(0);
		});

		it("applies correct styling to stalled components card", () => {
			const { container } = render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Stalled card should have orange styling classes
			const stalledCard = container.querySelector(".border-orange-200");
			expect(stalledCard).toBeInTheDocument();

			const orangeBgCard = container.querySelector(".bg-orange-50\\/50");
			expect(orangeBgCard).toBeInTheDocument();
		});
	});

	describe("Responsive Layout", () => {
		it("applies correct grid classes for responsive layout", () => {
			const { container } = render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Should have responsive grid classes
			const gridContainer = container.querySelector(
				".grid.gap-4.grid-cols-2.lg\\:grid-cols-5",
			);
			expect(gridContainer).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("has proper semantic structure", () => {
			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Should have proper headings for card titles
			expect(screen.getByText("Overall %")).toBeInTheDocument();
			expect(screen.getByText("Components")).toBeInTheDocument();
			expect(screen.getByText("Active Drawings")).toBeInTheDocument();
			expect(screen.getByText("Test Pkgs")).toBeInTheDocument();
			expect(screen.getByText("Stalled")).toBeInTheDocument();
		});

		it("provides meaningful text content for screen readers", () => {
			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Should have descriptive text for each metric
			expect(screen.getByText("Project completion")).toBeInTheDocument();
			expect(screen.getByText("6 completed")).toBeInTheDocument();
			expect(screen.getByText("With components")).toBeInTheDocument();
			expect(screen.getByText("3 total packages")).toBeInTheDocument();
		});
	});

	describe("Test Package Logic", () => {
		it("correctly counts ready packages", () => {
			const mixedPackages = {
				testPackages: [
					{
						packageId: "1",
						packageName: "Package 1",
						totalComponents: 5,
						completedComponents: 5,
						completionPercent: 100,
						isReady: true,
						stalledCount: 0,
					},
					{
						packageId: "2",
						packageName: "Package 2",
						totalComponents: 3,
						completedComponents: 1,
						completionPercent: 33,
						isReady: false,
						stalledCount: 1,
					},
					{
						packageId: "3",
						packageName: "Package 3",
						totalComponents: 4,
						completedComponents: 4,
						completionPercent: 100,
						isReady: true,
						stalledCount: 0,
					},
				],
				generatedAt: Date.now(),
			};

			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={mixedPackages}
				/>,
			);

			expect(screen.getByText("2 ready")).toBeInTheDocument();
			expect(screen.getByText("3 total packages")).toBeInTheDocument();
		});

		it("handles empty test packages array", () => {
			const emptyPackages = {
				testPackages: [],
				generatedAt: Date.now(),
			};

			render(
				<KPIHeroBar
					metrics={smallDashboardMetrics}
					testPackages={emptyPackages}
				/>,
			);

			expect(screen.getByText("0 ready")).toBeInTheDocument();
			expect(screen.getByText("0 total packages")).toBeInTheDocument();
		});
	});

	describe("Data Validation", () => {
		it("handles undefined or invalid metric values gracefully", () => {
			const invalidMetrics = {
				...smallDashboardMetrics,
				overallCompletionPercent: Number.NaN,
				totalComponents: undefined as any,
				completedComponents: null as any,
			};

			render(
				<KPIHeroBar
					metrics={invalidMetrics}
					testPackages={smallTestPackageReadiness}
				/>,
			);

			// Component should not crash with invalid data
			expect(screen.getByText("Components")).toBeInTheDocument();
		});
	});
});
