import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DrawingTreeItem } from "../DrawingTreeItem";
import { mockSimpleTree, mockComponentCounts } from "../../__fixtures__/drawings";

describe("DrawingTreeItem", () => {
  const mockOnToggleExpand = vi.fn();
  const mockOnSelect = vi.fn();

  const defaultProps = {
    drawing: mockSimpleTree[0],
    isExpanded: false,
    isSelected: false,
    onToggleExpand: mockOnToggleExpand,
    onSelect: mockOnSelect,
    level: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render drawing number and title", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      expect(screen.getByText("Main Process Flow")).toBeInTheDocument();
    });

    it("should render revision when present", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      expect(screen.getByText("Rev. A")).toBeInTheDocument();
    });

    it("should render expand button for drawings with children", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      expect(expandButton).toBeInTheDocument();
    });

    it("should not render expand button for drawings without children", () => {
      const drawingWithoutChildren = {
        ...mockSimpleTree[0],
        children: [],
      };

      render(
        <DrawingTreeItem
          {...defaultProps}
          drawing={drawingWithoutChildren}
        />
      );

      expect(screen.queryByRole("button", { name: /expand/i })).not.toBeInTheDocument();
    });

    it("should show chevron-right when collapsed", () => {
      const { container } = render(<DrawingTreeItem {...defaultProps} />);

      expect(container.querySelector(".lucide-chevron-right")).toBeInTheDocument();
    });

    it("should show chevron-down when expanded", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} isExpanded={true} />
      );

      expect(container.querySelector(".lucide-chevron-down")).toBeInTheDocument();
    });

    it("should render component count badge", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      // Component count badge should be rendered
      const badges = screen.getAllByText(/\d+/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should render file icon", () => {
      const { container } = render(<DrawingTreeItem {...defaultProps} />);

      expect(container.querySelector(".lucide-file-text")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply indentation based on level", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} level={2} />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.style.paddingLeft).toBe("40px"); // 2 * 16 + 8
    });

    it("should apply selected styles when selected", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} isSelected={true} />
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass("bg-accent");
      expect(item).toHaveClass("border-primary");
    });

    it("should apply hover styles", () => {
      const { container } = render(<DrawingTreeItem {...defaultProps} />);

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass("hover:bg-accent/50");
    });
  });

  describe("mobile variant", () => {
    it("should render stacked layout on mobile", () => {
      render(<DrawingTreeItem {...defaultProps} isMobile={true} />);

      // Number and title should still be present
      expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      expect(screen.getByText("Main Process Flow")).toBeInTheDocument();
    });

    it("should use smaller indentation on mobile", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} level={2} isMobile={true} />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.style.paddingLeft).toBe("32px"); // 2 * 12 + 8
    });

    it("should have larger touch target on mobile", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} isMobile={true} />
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass("min-h-[52px]");
    });

    it("should use compact badge variant on mobile", () => {
      render(<DrawingTreeItem {...defaultProps} isMobile={true} />);

      // Should render compact badge (single total count)
      expect(screen.getByText("25")).toBeInTheDocument(); // Total from fixture
    });
  });

  describe("interactions", () => {
    it("should call onSelect when clicked", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const item = screen.getByRole("treeitem");
      fireEvent.click(item);

      expect(mockOnSelect).toHaveBeenCalledWith("d1");
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it("should call onToggleExpand when expand button clicked", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      fireEvent.click(expandButton);

      expect(mockOnToggleExpand).toHaveBeenCalledWith("d1");
      expect(mockOnToggleExpand).toHaveBeenCalledTimes(1);
    });

    it("should not trigger onSelect when expand button clicked", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      fireEvent.click(expandButton);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it("should stop propagation on expand button click", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      const clickEvent = new MouseEvent("click", { bubbles: true });
      
      Object.defineProperty(clickEvent, "stopPropagation", {
        value: vi.fn(),
      });

      fireEvent(expandButton, clickEvent);

      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const item = screen.getByRole("treeitem");
      expect(item).toHaveAttribute("aria-expanded", "true"); // Has children
      expect(item).toHaveAttribute("aria-level", "1"); // Level 0 + 1
      expect(item).toHaveAttribute("aria-selected", "false");
    });

    it("should update aria-selected when selected", () => {
      render(<DrawingTreeItem {...defaultProps} isSelected={true} />);

      const item = screen.getByRole("treeitem");
      expect(item).toHaveAttribute("aria-selected", "true");
    });

    it("should update aria-expanded when expanded", () => {
      render(<DrawingTreeItem {...defaultProps} isExpanded={true} />);

      const item = screen.getByRole("treeitem");
      expect(item).toHaveAttribute("aria-expanded", "true");
    });

    it("should not have aria-expanded for leaf nodes", () => {
      const leafDrawing = {
        ...mockSimpleTree[0],
        children: [],
      };

      render(
        <DrawingTreeItem {...defaultProps} drawing={leafDrawing} />
      );

      const item = screen.getByRole("treeitem");
      expect(item).not.toHaveAttribute("aria-expanded");
    });

    it("should have proper button labels", () => {
      render(<DrawingTreeItem {...defaultProps} />);

      const expandButton = screen.getByRole("button");
      expect(expandButton).toHaveAttribute("aria-label", "Expand");
    });

    it("should update button label when expanded", () => {
      render(<DrawingTreeItem {...defaultProps} isExpanded={true} />);

      const collapseButton = screen.getByRole("button");
      expect(collapseButton).toHaveAttribute("aria-label", "Collapse");
    });
  });

  describe("edge cases", () => {
    it("should handle drawing without revision", () => {
      const drawingWithoutRevision = {
        ...mockSimpleTree[0],
        revision: null,
      };

      render(
        <DrawingTreeItem
          {...defaultProps}
          drawing={drawingWithoutRevision}
        />
      );

      expect(screen.queryByText(/Rev\./)).not.toBeInTheDocument();
    });

    it("should handle drawing without component count", () => {
      const drawingWithoutCount = {
        ...mockSimpleTree[0],
        componentCount: undefined,
      };

      const { container } = render(
        <DrawingTreeItem
          {...defaultProps}
          drawing={drawingWithoutCount}
        />
      );

      // Badge should not be rendered
      const badges = container.querySelectorAll('[class*="badge"]');
      expect(badges.length).toBe(0);
    });

    it("should handle very long titles", () => {
      const longTitleDrawing = {
        ...mockSimpleTree[0],
        title: "This is a very long drawing title that should be truncated to prevent layout issues in the tree view",
      };

      render(
        <DrawingTreeItem
          {...defaultProps}
          drawing={longTitleDrawing}
        />
      );

      const title = screen.getByText(longTitleDrawing.title);
      expect(title).toHaveClass("truncate");
    });

    it("should handle deep nesting levels", () => {
      const { container } = render(
        <DrawingTreeItem {...defaultProps} level={10} />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.style.paddingLeft).toBe("168px"); // 10 * 16 + 8
    });
  });
});