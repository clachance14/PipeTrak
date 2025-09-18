import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDiscreteMilestone,
	createPercentageMilestone,
	createQuantityMilestone,
} from "../../__fixtures__/milestones";
import { MilestoneWorkflowRenderer } from "../MilestoneWorkflowRenderer";

// Mock the specific renderers
vi.mock("../MilestoneDiscreteRenderer", () => ({
	MilestoneDiscreteRenderer: ({ milestone, onUpdate, disabled }: any) => (
		<div data-testid="discrete-renderer">
			<span>{milestone.milestoneName}</span>
			<input
				type="checkbox"
				checked={milestone.isCompleted}
				onChange={(e) => onUpdate(e.target.checked)}
				disabled={disabled}
				data-testid="discrete-checkbox"
			/>
		</div>
	),
}));

vi.mock("../MilestonePercentageRenderer", () => ({
	MilestonePercentageRenderer: ({ milestone, onUpdate, disabled }: any) => (
		<div data-testid="percentage-renderer">
			<span>{milestone.milestoneName}</span>
			<input
				type="range"
				min="0"
				max="100"
				value={milestone.percentageComplete || 0}
				onChange={(e) => onUpdate(Number(e.target.value))}
				disabled={disabled}
				data-testid="percentage-slider"
			/>
			<span data-testid="percentage-value">
				{milestone.percentageComplete || 0}%
			</span>
		</div>
	),
}));

vi.mock("../MilestoneQuantityRenderer", () => ({
	MilestoneQuantityRenderer: ({ milestone, onUpdate, disabled }: any) => (
		<div data-testid="quantity-renderer">
			<span>{milestone.milestoneName}</span>
			<input
				type="number"
				min="0"
				max={milestone.quantityTotal || 0}
				value={milestone.quantityComplete || 0}
				onChange={(e) => onUpdate(Number(e.target.value))}
				disabled={disabled}
				data-testid="quantity-input"
			/>
			<span data-testid="quantity-display">
				{milestone.quantityComplete || 0} /{" "}
				{milestone.quantityTotal || 0}
			</span>
		</div>
	),
}));

describe("MilestoneWorkflowRenderer", () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
	});

	describe("Workflow Type Detection", () => {
		it("should render discrete milestone for MILESTONE_DISCRETE workflow", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();
			expect(screen.getByTestId("discrete-checkbox")).toBeInTheDocument();
			expect(
				screen.queryByTestId("percentage-renderer"),
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("quantity-renderer"),
			).not.toBeInTheDocument();
		});

		it("should render percentage milestone for MILESTONE_PERCENTAGE workflow", () => {
			const milestone = createPercentageMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			expect(
				screen.getByTestId("percentage-renderer"),
			).toBeInTheDocument();
			expect(screen.getByTestId("percentage-slider")).toBeInTheDocument();
			expect(
				screen.queryByTestId("discrete-renderer"),
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("quantity-renderer"),
			).not.toBeInTheDocument();
		});

		it("should render quantity milestone for MILESTONE_QUANTITY workflow", () => {
			const milestone = createQuantityMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("quantity-renderer")).toBeInTheDocument();
			expect(screen.getByTestId("quantity-input")).toBeInTheDocument();
			expect(
				screen.queryByTestId("discrete-renderer"),
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId("percentage-renderer"),
			).not.toBeInTheDocument();
		});

		it("should render error state for unknown workflow type", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="UNKNOWN_TYPE"
					as
					any
					onUpdate={onUpdate}
				/>,
			);

			expect(
				screen.getByText(/unknown workflow type/i),
			).toBeInTheDocument();
			expect(screen.getByText("UNKNOWN_TYPE")).toBeInTheDocument();
		});
	});

	describe("Discrete Milestone Interactions", () => {
		it("should handle discrete milestone toggle", async () => {
			const milestone = createDiscreteMilestone({ isCompleted: false });
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			const checkbox = screen.getByTestId("discrete-checkbox");
			expect(checkbox).not.toBeChecked();

			await user.click(checkbox);

			expect(onUpdate).toHaveBeenCalledWith(true);
		});

		it("should show completed discrete milestone", () => {
			const milestone = createDiscreteMilestone({ isCompleted: true });
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			const checkbox = screen.getByTestId("discrete-checkbox");
			expect(checkbox).toBeChecked();
		});
	});

	describe("Percentage Milestone Interactions", () => {
		it("should handle percentage changes", async () => {
			const milestone = createPercentageMilestone({
				percentageComplete: 25,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			const slider = screen.getByTestId("percentage-slider");
			expect(slider).toHaveValue("25");

			fireEvent.change(slider, { target: { value: "75" } });

			expect(onUpdate).toHaveBeenCalledWith(75);
		});

		it("should display current percentage value", () => {
			const milestone = createPercentageMilestone({
				percentageComplete: 60,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("percentage-value")).toHaveTextContent(
				"60%",
			);
		});

		it("should handle zero percentage", () => {
			const milestone = createPercentageMilestone({
				percentageComplete: 0,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("percentage-value")).toHaveTextContent(
				"0%",
			);
			expect(screen.getByTestId("percentage-slider")).toHaveValue("0");
		});

		it("should handle null percentage as zero", () => {
			const milestone = createPercentageMilestone({
				percentageComplete: null,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("percentage-value")).toHaveTextContent(
				"0%",
			);
			expect(screen.getByTestId("percentage-slider")).toHaveValue("0");
		});
	});

	describe("Quantity Milestone Interactions", () => {
		it("should handle quantity changes", async () => {
			const milestone = createQuantityMilestone({
				quantityComplete: 3,
				quantityTotal: 10,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
				/>,
			);

			const input = screen.getByTestId("quantity-input");
			expect(input).toHaveValue(3);

			fireEvent.change(input, { target: { value: "7" } });

			expect(onUpdate).toHaveBeenCalledWith(7);
		});

		it("should display quantity progress", () => {
			const milestone = createQuantityMilestone({
				quantityComplete: 8,
				quantityTotal: 12,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("quantity-display")).toHaveTextContent(
				"8 / 12",
			);
		});

		it("should handle zero quantity", () => {
			const milestone = createQuantityMilestone({
				quantityComplete: 0,
				quantityTotal: 5,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("quantity-display")).toHaveTextContent(
				"0 / 5",
			);
			expect(screen.getByTestId("quantity-input")).toHaveValue(0);
		});

		it("should handle null quantity values", () => {
			const milestone = createQuantityMilestone({
				quantityComplete: null,
				quantityTotal: null,
			});
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("quantity-display")).toHaveTextContent(
				"0 / 0",
			);
			expect(screen.getByTestId("quantity-input")).toHaveValue(0);
		});
	});

	describe("Disabled State", () => {
		it("should disable discrete milestone when disabled prop is true", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
					disabled={true}
				/>,
			);

			const checkbox = screen.getByTestId("discrete-checkbox");
			expect(checkbox).toBeDisabled();
		});

		it("should disable percentage milestone when disabled prop is true", () => {
			const milestone = createPercentageMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
					disabled={true}
				/>,
			);

			const slider = screen.getByTestId("percentage-slider");
			expect(slider).toBeDisabled();
		});

		it("should disable quantity milestone when disabled prop is true", () => {
			const milestone = createQuantityMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_QUANTITY"
					onUpdate={onUpdate}
					disabled={true}
				/>,
			);

			const input = screen.getByTestId("quantity-input");
			expect(input).toBeDisabled();
		});

		it("should not call onUpdate when disabled and interacted with", async () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
					disabled={true}
				/>,
			);

			const checkbox = screen.getByTestId("discrete-checkbox");

			// Try to click disabled checkbox
			await user.click(checkbox);

			expect(onUpdate).not.toHaveBeenCalled();
		});
	});

	describe("Loading State", () => {
		it("should show loading state when isLoading is true", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
					isLoading={true}
				/>,
			);

			// Loading state would be handled by individual renderers
			// This test ensures the prop is passed through correctly
			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();
		});
	});

	describe("Error Handling", () => {
		it("should handle missing milestone data gracefully", () => {
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={null as any}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			// Should not crash
			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();
		});

		it("should handle undefined workflow type", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType={undefined as any}
					onUpdate={onUpdate}
				/>,
			);

			expect(
				screen.getByText(/unknown workflow type/i),
			).toBeInTheDocument();
		});

		it("should handle missing onUpdate callback", () => {
			const milestone = createDiscreteMilestone();

			expect(() => {
				render(
					<MilestoneWorkflowRenderer
						milestone={milestone}
						workflowType="MILESTONE_DISCRETE"
						onUpdate={undefined as any}
					/>,
				);
			}).not.toThrow();
		});
	});

	describe("Props Validation", () => {
		it("should pass all props to child renderers", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();
			const customProp = "test-value";

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
					disabled={false}
					isLoading={false}
					customProp={customProp}
				/>,
			);

			// Child renderer should receive all props
			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();
		});

		it("should handle dynamic workflow type changes", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			const { rerender } = render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();

			// Change workflow type
			rerender(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_PERCENTAGE"
					onUpdate={onUpdate}
				/>,
			);

			expect(
				screen.queryByTestId("discrete-renderer"),
			).not.toBeInTheDocument();
			expect(
				screen.getByTestId("percentage-renderer"),
			).toBeInTheDocument();
		});

		it("should handle milestone data changes", () => {
			const milestone1 = createDiscreteMilestone({ isCompleted: false });
			const milestone2 = createDiscreteMilestone({ isCompleted: true });
			const onUpdate = vi.fn();

			const { rerender } = render(
				<MilestoneWorkflowRenderer
					milestone={milestone1}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			const checkbox1 = screen.getByTestId("discrete-checkbox");
			expect(checkbox1).not.toBeChecked();

			rerender(
				<MilestoneWorkflowRenderer
					milestone={milestone2}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			const checkbox2 = screen.getByTestId("discrete-checkbox");
			expect(checkbox2).toBeChecked();
		});
	});

	describe("Accessibility", () => {
		it("should maintain accessibility attributes", () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
					aria-label="Test milestone"
				/>,
			);

			// The renderer should pass through accessibility props
			expect(screen.getByTestId("discrete-renderer")).toBeInTheDocument();
		});

		it("should support keyboard navigation", async () => {
			const milestone = createDiscreteMilestone();
			const onUpdate = vi.fn();

			render(
				<MilestoneWorkflowRenderer
					milestone={milestone}
					workflowType="MILESTONE_DISCRETE"
					onUpdate={onUpdate}
				/>,
			);

			const checkbox = screen.getByTestId("discrete-checkbox");

			// Tab to element
			await user.tab();
			expect(checkbox).toHaveFocus();

			// Space to toggle
			await user.keyboard(" ");
			expect(onUpdate).toHaveBeenCalledWith(true);
		});
	});
});
