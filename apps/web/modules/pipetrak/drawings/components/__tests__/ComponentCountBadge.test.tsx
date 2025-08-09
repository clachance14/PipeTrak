import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentCountBadge } from "../ComponentCountBadge";
import { mockComponentCounts } from "../../__fixtures__/drawings";

describe("ComponentCountBadge", () => {
  describe("default variant", () => {
    it("should render status badges with counts", () => {
      render(
        <ComponentCountBadge componentCount={mockComponentCounts.inProgress} />
      );

      // Should show badges for each non-zero status
      expect(screen.getByText("10")).toBeInTheDocument(); // notStarted
      expect(screen.getByText("10", { selector: ":nth-of-type(2)" })).toBeInTheDocument(); // inProgress
      expect(screen.getByText("5")).toBeInTheDocument(); // completed
    });

    it("should not render when total is 0", () => {
      const { container } = render(
        <ComponentCountBadge componentCount={mockComponentCounts.empty} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when componentCount is undefined", () => {
      const { container } = render(<ComponentCountBadge />);

      expect(container.firstChild).toBeNull();
    });

    it("should only show badges for non-zero counts", () => {
      render(
        <ComponentCountBadge componentCount={mockComponentCounts.allComplete} />
      );

      // Only completed badge should be shown
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("should apply correct color classes", () => {
      const { container } = render(
        <ComponentCountBadge componentCount={mockComponentCounts.mostlyComplete} />
      );

      const badges = container.querySelectorAll(".bg-gray-50");
      expect(badges.length).toBeGreaterThan(0); // Has not started badges

      const completedBadges = container.querySelectorAll(".bg-green-50");
      expect(completedBadges.length).toBeGreaterThan(0);
    });
  });

  describe("compact variant", () => {
    it("should render single badge with total count", () => {
      render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.inProgress} 
          variant="compact"
        />
      );

      expect(screen.getByText("25")).toBeInTheDocument(); // Total only
      expect(screen.queryByText("10")).not.toBeInTheDocument(); // No breakdown
    });

    it("should apply color based on completion percentage", () => {
      // All complete - should be green
      const { container: container1 } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.allComplete} 
          variant="compact"
        />
      );
      expect(container1.querySelector(".border-green-500")).toBeInTheDocument();

      // In progress - should be blue
      const { container: container2 } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.inProgress} 
          variant="compact"
        />
      );
      expect(container2.querySelector(".border-blue-500")).toBeInTheDocument();

      // Not started - should be gray
      const { container: container3 } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.allNotStarted} 
          variant="compact"
        />
      );
      expect(container3.querySelector(".border-gray-400")).toBeInTheDocument();
    });
  });

  describe("detailed variant", () => {
    it("should render all status counts with labels", () => {
      render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.mostlyComplete} 
          variant="detailed"
        />
      );

      expect(screen.getByText("Total:")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument(); // Total count
      expect(screen.getByText("2")).toBeInTheDocument(); // notStarted
      expect(screen.getByText("3")).toBeInTheDocument(); // inProgress
      expect(screen.getByText("43")).toBeInTheDocument(); // completed
    });

    it("should show color indicators for each status", () => {
      const { container } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.mostlyComplete} 
          variant="detailed"
        />
      );

      // Check for color dots
      expect(container.querySelector(".bg-gray-400")).toBeInTheDocument();
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
      expect(container.querySelector(".bg-green-500")).toBeInTheDocument();
      expect(container.querySelector(".bg-amber-500")).toBeInTheDocument();
    });

    it("should not show zero counts", () => {
      render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.allComplete} 
          variant="detailed"
        />
      );

      // Should not show notStarted, inProgress, or onHold
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.inProgress} 
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("edge cases", () => {
    it("should handle all zero statuses except total", () => {
      const allZero = {
        total: 10,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        onHold: 0,
      };

      const { container } = render(
        <ComponentCountBadge componentCount={allZero} />
      );

      // Should render nothing as all individual counts are 0
      const badges = container.querySelectorAll('[class*="Badge"]');
      expect(badges.length).toBe(0);
    });

    it("should calculate correct completion percentage", () => {
      const halfComplete = {
        total: 100,
        notStarted: 25,
        inProgress: 25,
        completed: 50,
        onHold: 0,
      };

      const { container } = render(
        <ComponentCountBadge componentCount={halfComplete} variant="compact" />
      );

      // 50% complete should show blue border
      expect(container.querySelector(".border-blue-500")).toBeInTheDocument();
    });

    it("should handle very large numbers", () => {
      const largeNumbers = {
        total: 10000,
        notStarted: 2500,
        inProgress: 2500,
        completed: 5000,
        onHold: 0,
      };

      render(
        <ComponentCountBadge componentCount={largeNumbers} />
      );

      expect(screen.getByText("2500")).toBeInTheDocument();
      expect(screen.getByText("5000")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic structure", () => {
      const { container } = render(
        <ComponentCountBadge 
          componentCount={mockComponentCounts.inProgress} 
          variant="detailed"
        />
      );

      // Check for proper text content
      const totalLabel = screen.getByText("Total:");
      expect(totalLabel).toBeInTheDocument();
    });
  });
});