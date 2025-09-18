/**
 * Unit tests for ActivityFeed component
 * Tests activity rendering, filtering, sparklines, and user interactions
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
	generateRecentActivity,
	smallRecentActivity,
} from "../__fixtures__/dashboard-data";
import { ActivityFeed } from "../components/ActivityFeed";
import type { RecentActivity } from "../types";

describe("ActivityFeed", () => {
	describe("Empty State", () => {
		it("renders empty state when data is null", () => {
			render(<ActivityFeed data={null} />);

			expect(screen.getByText("Recent Activity")).toBeInTheDocument();
			expect(screen.getByText("No recent activity")).toBeInTheDocument();
		});

		it("renders empty state when activities array is empty", () => {
			const emptyData: RecentActivity = {
				activities: [],
				generatedAt: Date.now(),
				limit: 50,
			};

			render(<ActivityFeed data={emptyData} />);

			expect(screen.getByText("No recent activity")).toBeInTheDocument();
		});
	});

	describe("Activity Rendering", () => {
		it("renders all activities with correct information", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Check for user names from fixture
			expect(screen.getByText("John Smith")).toBeInTheDocument();
			expect(screen.getByText("Jane Doe")).toBeInTheDocument();

			// Check for component IDs
			expect(screen.getByText("VALVE-001")).toBeInTheDocument();
			expect(screen.getByText("PIPE-002")).toBeInTheDocument();
			expect(screen.getByText("FITTING-003")).toBeInTheDocument();

			// Check for component types
			expect(screen.getByText("Ball Valve")).toBeInTheDocument();
			expect(screen.getByText("Steel Pipe")).toBeInTheDocument();
			expect(screen.getByText("Elbow Fitting")).toBeInTheDocument();
		});

		it("displays milestone completion activities correctly", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show milestone names for completion activities
			expect(screen.getByText("Installation")).toBeInTheDocument();
			expect(screen.getByText("Quality Check")).toBeInTheDocument();
		});

		it("displays component update activities correctly", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show update activities without milestone names
			const updateActivities = screen.getAllByText(/updated/i);
			expect(updateActivities.length).toBeGreaterThan(0);
		});

		it("shows relative timestamps", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show "hours ago" format
			expect(screen.getByText("1 hour ago")).toBeInTheDocument();
			expect(screen.getByText("2 hours ago")).toBeInTheDocument();
			expect(screen.getByText("4 hours ago")).toBeInTheDocument();
		});
	});

	describe("User Filtering", () => {
		it("displays user filter dropdown", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show filter dropdown
			expect(
				screen.getByTestId("activity-user-filter"),
			).toBeInTheDocument();
		});

		it("shows all users in filter options", async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			// Click filter dropdown
			await user.click(screen.getByTestId("activity-user-filter"));

			// Should show all users from activities
			expect(screen.getByText("All Users")).toBeInTheDocument();
			expect(screen.getByText("John Smith")).toBeInTheDocument();
			expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		});

		it("filters activities by selected user", async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			// Open filter and select user
			await user.click(screen.getByTestId("activity-user-filter"));
			await user.click(screen.getByText("John Smith"));

			// Should only show John Smith's activities
			expect(screen.getAllByText("John Smith")).toHaveLength(2); // From fixture
			expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
		});

		it('resets filter when "All Users" is selected', async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			// Filter by user first
			await user.click(screen.getByTestId("activity-user-filter"));
			await user.click(screen.getByText("John Smith"));

			// Reset filter
			await user.click(screen.getByTestId("activity-user-filter"));
			await user.click(screen.getByText("All Users"));

			// Should show all activities again
			expect(screen.getByText("John Smith")).toBeInTheDocument();
			expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		});
	});

	describe("Activity Icons and Visual Elements", () => {
		it("displays appropriate icons for different activity types", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should have icons for different activity types
			const activityItems = screen.getAllByTestId("activity-item");
			expect(activityItems.length).toBeGreaterThan(0);

			// Each activity item should have an icon
			activityItems.forEach((item) => {
				expect(item.querySelector("svg")).toBeInTheDocument();
			});
		});

		it("uses different colors for different activity types", () => {
			const { container } = render(
				<ActivityFeed data={smallRecentActivity} />,
			);

			// Should have different styling for completion vs update activities
			const completionItems = container.querySelectorAll(
				'[class*="text-green"], [class*="bg-green"]',
			);
			const updateItems = container.querySelectorAll(
				'[class*="text-blue"], [class*="bg-blue"]',
			);

			expect(completionItems.length + updateItems.length).toBeGreaterThan(
				0,
			);
		});
	});

	describe("Sparklines", () => {
		it("renders sparklines for activity trends", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show sparkline container
			const sparklines = screen.getAllByTestId("activity-sparkline");
			expect(sparklines.length).toBeGreaterThan(0);
		});

		it("sparklines contain SVG elements", () => {
			const { container } = render(
				<ActivityFeed data={smallRecentActivity} />,
			);

			const sparklineSvgs = container.querySelectorAll(
				'[data-testid="activity-sparkline"] svg',
			);
			expect(sparklineSvgs.length).toBeGreaterThan(0);
		});
	});

	describe("Activity Details", () => {
		it("shows completion percentage for milestone activities", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Should show completion percentages from fixture
			expect(screen.getByText("60%")).toBeInTheDocument();
			expect(screen.getByText("80%")).toBeInTheDocument();
		});

		it("expands activity details when clicked", async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			// Click on first activity item
			const firstActivity = screen.getAllByTestId("activity-item")[0];
			await user.click(firstActivity);

			// Should show expanded details
			expect(screen.getByTestId("activity-details")).toBeVisible();
		});

		it("collapses expanded details when clicked again", async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			const firstActivity = screen.getAllByTestId("activity-item")[0];

			// Expand
			await user.click(firstActivity);
			expect(screen.getByTestId("activity-details")).toBeVisible();

			// Collapse
			await user.click(firstActivity);
			expect(screen.queryByTestId("activity-details")).not.toBeVisible();
		});
	});

	describe("Load More Functionality", () => {
		it("shows load more button when there are more activities", () => {
			const limitedData: RecentActivity = {
				...smallRecentActivity,
				limit: 2, // Fewer than available
			};

			render(<ActivityFeed data={limitedData} />);

			expect(screen.getByText("Load More")).toBeInTheDocument();
		});

		it("does not show load more when all activities are shown", () => {
			const completeData: RecentActivity = {
				...smallRecentActivity,
				limit: 100, // More than available
			};

			render(<ActivityFeed data={completeData} />);

			expect(screen.queryByText("Load More")).not.toBeInTheDocument();
		});

		it("loads more activities when button is clicked", async () => {
			const user = userEvent.setup();
			const moreActivitiesData: RecentActivity = {
				activities: generateRecentActivity(20).activities,
				generatedAt: Date.now(),
				limit: 10,
			};

			render(<ActivityFeed data={moreActivitiesData} />);

			// Initially shows limited activities
			expect(screen.getAllByTestId("activity-item")).toHaveLength(10);

			// Click load more
			await user.click(screen.getByText("Load More"));

			// Should show more activities
			expect(screen.getAllByTestId("activity-item")).toHaveLength(20);
		});
	});

	describe("Performance", () => {
		it("renders large activity lists efficiently", () => {
			const largeActivityData = generateRecentActivity(500);

			const startTime = performance.now();
			render(<ActivityFeed data={largeActivityData} />);
			const endTime = performance.now();

			// Should render quickly even with many activities
			expect(endTime - startTime).toBeLessThan(1000); // 1 second budget
		});

		it("virtual scrolling works with large datasets", () => {
			const largeActivityData = generateRecentActivity(1000);
			const { container } = render(
				<ActivityFeed data={largeActivityData} />,
			);

			// Should use virtual scrolling for large datasets
			const scrollContainer = container.querySelector(
				'[data-testid="activity-scroll-container"]',
			);
			expect(scrollContainer).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("provides proper ARIA labels for activities", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			const activityItems = screen.getAllByTestId("activity-item");
			activityItems.forEach((item) => {
				expect(item).toHaveAttribute("role", "button");
				expect(item).toHaveAttribute("tabindex", "0");
			});
		});

		it("supports keyboard navigation", async () => {
			const user = userEvent.setup();
			render(<ActivityFeed data={smallRecentActivity} />);

			const firstActivity = screen.getAllByTestId("activity-item")[0];

			// Should be focusable
			firstActivity.focus();
			expect(firstActivity).toHaveFocus();

			// Should expand on Enter
			await user.keyboard("{Enter}");
			expect(screen.getByTestId("activity-details")).toBeVisible();

			// Should collapse on Escape
			await user.keyboard("{Escape}");
			expect(screen.queryByTestId("activity-details")).not.toBeVisible();
		});

		it("provides screen reader friendly timestamps", () => {
			render(<ActivityFeed data={smallRecentActivity} />);

			// Timestamps should be in readable format
			const timestamps = screen.getAllByText(/\d+ hours? ago/);
			expect(timestamps.length).toBeGreaterThan(0);
		});
	});

	describe("Edge Cases", () => {
		it("handles activities with missing user information", () => {
			const incompleteData: RecentActivity = {
				activities: [
					{
						activityType: "milestone_completed",
						timestamp: Date.now() - 3600000,
						userId: null,
						userName: "Unknown User",
						componentId: "COMP-001",
						componentType: "Component",
						milestoneName: "Test",
						details: {
							componentId: "COMP-001",
							componentType: "Component",
							milestoneName: "Test",
						},
					},
				],
				generatedAt: Date.now(),
				limit: 50,
			};

			render(<ActivityFeed data={incompleteData} />);

			expect(screen.getByText("Unknown User")).toBeInTheDocument();
		});

		it("handles very recent activities", () => {
			const recentData: RecentActivity = {
				activities: [
					{
						activityType: "component_updated",
						timestamp: Date.now() - 30000, // 30 seconds ago
						userId: "user-1",
						userName: "Recent User",
						componentId: "COMP-RECENT",
						componentType: "Recent Component",
						milestoneName: null,
						details: {
							componentId: "COMP-RECENT",
							componentType: "Recent Component",
							action: "component_updated",
						},
					},
				],
				generatedAt: Date.now(),
				limit: 50,
			};

			render(<ActivityFeed data={recentData} />);

			// Should show "Just now" or similar for very recent activities
			expect(
				screen.getByText(/Just now|less than a minute ago/),
			).toBeInTheDocument();
		});

		it("handles activities with very long component names", () => {
			const longNameData: RecentActivity = {
				activities: [
					{
						activityType: "milestone_completed",
						timestamp: Date.now() - 3600000,
						userId: "user-1",
						userName: "Test User",
						componentId:
							"VERY-LONG-COMPONENT-ID-THAT-MIGHT-OVERFLOW-THE-UI-LAYOUT",
						componentType:
							"Very Long Component Type Name That Should Be Handled Gracefully",
						milestoneName:
							"Very Long Milestone Name That Should Not Break The Layout",
						details: {
							componentId:
								"VERY-LONG-COMPONENT-ID-THAT-MIGHT-OVERFLOW-THE-UI-LAYOUT",
							componentType:
								"Very Long Component Type Name That Should Be Handled Gracefully",
							milestoneName:
								"Very Long Milestone Name That Should Not Break The Layout",
						},
					},
				],
				generatedAt: Date.now(),
				limit: 50,
			};

			// Should not crash with long names
			expect(() =>
				render(<ActivityFeed data={longNameData} />),
			).not.toThrow();
		});

		it("handles invalid timestamp data", () => {
			const invalidTimestampData: RecentActivity = {
				activities: [
					{
						activityType: "milestone_completed",
						timestamp: Number.NaN,
						userId: "user-1",
						userName: "Test User",
						componentId: "COMP-001",
						componentType: "Component",
						milestoneName: "Test",
						details: {
							componentId: "COMP-001",
							componentType: "Component",
							milestoneName: "Test",
						},
					},
				],
				generatedAt: Date.now(),
				limit: 50,
			};

			// Should handle invalid timestamps gracefully
			expect(() =>
				render(<ActivityFeed data={invalidTimestampData} />),
			).not.toThrow();
		});
	});

	describe("Responsive Behavior", () => {
		it("adapts layout for mobile screens", () => {
			// Simulate mobile viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 400,
			});

			render(<ActivityFeed data={smallRecentActivity} />);

			// Should adapt for mobile (exact implementation depends on component)
			const activityFeed = screen.getByTestId("activity-feed");
			expect(activityFeed).toBeInTheDocument();
		});

		it("shows condensed view on smaller screens", () => {
			const { container } = render(
				<ActivityFeed data={smallRecentActivity} />,
			);

			// Should have responsive classes
			const responsiveElements = container.querySelectorAll(
				'[class*="sm:"], [class*="md:"], [class*="lg:"]',
			);
			expect(responsiveElements.length).toBeGreaterThan(0);
		});
	});
});
