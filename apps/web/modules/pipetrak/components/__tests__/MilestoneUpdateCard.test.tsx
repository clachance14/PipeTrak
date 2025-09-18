import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MilestoneUpdateCard } from "../components/MilestoneUpdateCard";
import type { Milestone } from "../../types";

const mockMilestone: Milestone = {
  id: "milestone-1",
  name: "Fabrication",
  sequenceNumber: 1,
  weight: 10,
  workflowType: "DISCRETE",
  isComplete: false,
  percentComplete: 0,
  quantityComplete: 0,
  quantityRequired: 0,
  unit: "",
  dependencies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationId: "org-1",
  projectId: "proj-1",
  milestoneTemplateId: "template-1",
  componentId: "comp-1",
  totalInWorkflow: 5,
};

describe("MilestoneUpdateCard", () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Discrete Workflow", () => {
    it("should render discrete milestone with checkbox", () => {
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Fabrication")).toBeInTheDocument();
      expect(screen.getByText("1 of 5")).toBeInTheDocument();
      expect(screen.getByText("10 credits")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should toggle checkbox on click", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
        />
      );

      const checkboxContainer = screen.getByText("Fabrication").closest("div");
      if (checkboxContainer) {
        await user.click(checkboxContainer);
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      }
    });

    it("should call onUpdate when saved", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
        />
      );

      const checkboxContainer = screen.getByText("Fabrication").closest("div");
      if (checkboxContainer) {
        await user.click(checkboxContainer);
        const saveButton = screen.getByRole("button", { name: /save/i });
        await user.click(saveButton);
        
        await waitFor(() => {
          expect(mockOnUpdate).toHaveBeenCalledWith(true);
        });
      }
    });

    it("should show as locked when isLocked is true", () => {
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          isLocked={true}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Locked")).toBeInTheDocument();
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });
  });

  describe("Percentage Workflow", () => {
    const percentageMilestone = {
      ...mockMilestone,
      workflowType: "PERCENTAGE" as const,
      percentComplete: 25,
    };

    it("should render percentage milestone with slider", () => {
      render(
        <MilestoneUpdateCard
          milestone={percentageMilestone}
          workflowType="PERCENTAGE"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Fabrication")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toBeInTheDocument();
      expect(screen.getByDisplayValue("25")).toBeInTheDocument();
    });

    it("should update percentage with slider", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={percentageMilestone}
          workflowType="PERCENTAGE"
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("25");
      await user.clear(input);
      await user.type(input, "75");
      
      expect(screen.getByRole("button", { name: /save 75%/i })).toBeInTheDocument();
    });

    it("should limit percentage to 0-100", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={percentageMilestone}
          workflowType="PERCENTAGE"
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("25");
      await user.clear(input);
      await user.type(input, "150");
      
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });
  });

  describe("Quantity Workflow", () => {
    const quantityMilestone = {
      ...mockMilestone,
      workflowType: "QUANTITY" as const,
      quantityComplete: 50,
      quantityRequired: 100,
      unit: "ft",
    };

    it("should render quantity milestone with input", () => {
      render(
        <MilestoneUpdateCard
          milestone={quantityMilestone}
          workflowType="QUANTITY"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Fabrication")).toBeInTheDocument();
      expect(screen.getByDisplayValue("50")).toBeInTheDocument();
      expect(screen.getByText("/ 100 ft")).toBeInTheDocument();
      expect(screen.getByText("50 of 100 ft complete")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should update quantity with input", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={quantityMilestone}
          workflowType="QUANTITY"
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("50");
      await user.clear(input);
      await user.type(input, "75.5");
      
      expect(screen.getByRole("button", { name: /save 75.5 ft/i })).toBeInTheDocument();
    });

    it("should calculate percentage correctly", () => {
      const milestone75 = {
        ...quantityMilestone,
        quantityComplete: 75,
      };
      
      render(
        <MilestoneUpdateCard
          milestone={milestone75}
          workflowType="QUANTITY"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should not exceed quantity required", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={quantityMilestone}
          workflowType="QUANTITY"
          onUpdate={mockOnUpdate}
        />
      );

      const input = screen.getByDisplayValue("50");
      await user.clear(input);
      await user.type(input, "150");
      
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });
  });

  describe("Touch Targets", () => {
    it("should respect touchTargetSize prop", () => {
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
          touchTargetSize={52}
        />
      );

      const checkboxContainer = screen.getByText("Fabrication").closest("div");
      expect(checkboxContainer).toHaveStyle({ minHeight: "52px" });
    });
  });

  describe("Dependencies", () => {
    const milestoneWithDeps = {
      ...mockMilestone,
      dependencies: ["Receiving", "Inspection"],
    };

    it("should show dependencies when present", () => {
      render(
        <MilestoneUpdateCard
          milestone={milestoneWithDeps}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Requires: Receiving, Inspection")).toBeInTheDocument();
    });
  });

  describe("Cancel Action", () => {
    it("should cancel changes and hide save button", async () => {
      const user = userEvent.setup();
      render(
        <MilestoneUpdateCard
          milestone={mockMilestone}
          workflowType="DISCRETE"
          onUpdate={mockOnUpdate}
        />
      );

      // Make a change
      const checkboxContainer = screen.getByText("Fabrication").closest("div");
      if (checkboxContainer) {
        await user.click(checkboxContainer);
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
        
        // Cancel the change
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        await user.click(cancelButton);
        
        // Save button should be gone
        expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
        expect(mockOnUpdate).not.toHaveBeenCalled();
      }
    });
  });
});