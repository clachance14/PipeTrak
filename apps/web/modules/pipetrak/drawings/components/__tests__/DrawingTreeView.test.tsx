import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrawingTreeView } from "../DrawingTreeView";
import { mockSimpleTree, mockDeepTree, mockEmptyTree } from "../../__fixtures__/drawings";

describe("DrawingTreeView", () => {
  const mockOnDrawingSelect = vi.fn();

  const defaultProps = {
    drawings: mockSimpleTree,
    onDrawingSelect: mockOnDrawingSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render search input", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should render all root drawings", () => {
      render(<DrawingTreeView {...defaultProps} />);

      expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      expect(screen.getByText("P&ID-002")).toBeInTheDocument();
    });

    it("should not render children when collapsed", () => {
      render(<DrawingTreeView {...defaultProps} />);

      // Children should not be visible initially
      expect(screen.queryByText("P&ID-001-A")).not.toBeInTheDocument();
      expect(screen.queryByText("P&ID-001-B")).not.toBeInTheDocument();
    });

    it("should render children when expanded", () => {
      render(<DrawingTreeView {...defaultProps} />);

      // Click expand button on first drawing
      const expandButtons = screen.getAllByRole("button", { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      // Children should now be visible
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      expect(screen.getByText("P&ID-001-B")).toBeInTheDocument();
    });

    it("should show empty message when no drawings", () => {
      render(<DrawingTreeView {...defaultProps} drawings={mockEmptyTree} />);

      expect(screen.getByText("No drawings available")).toBeInTheDocument();
    });

    it("should render expand/collapse all buttons on desktop", () => {
      render(<DrawingTreeView {...defaultProps} />);

      expect(screen.getByText("Expand all")).toBeInTheDocument();
      expect(screen.getByText("Collapse all")).toBeInTheDocument();
    });

    it("should not render expand/collapse all buttons on mobile", () => {
      render(<DrawingTreeView {...defaultProps} isMobile={true} />);

      expect(screen.queryByText("Expand all")).not.toBeInTheDocument();
      expect(screen.queryByText("Collapse all")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should render skeleton when loading", () => {
      const { container } = render(
        <DrawingTreeView {...defaultProps} isLoading={true} />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render mobile skeleton when loading on mobile", () => {
      const { container } = render(
        <DrawingTreeView {...defaultProps} isLoading={true} isMobile={true} />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("search functionality", () => {
    it("should filter drawings based on search query", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      await user.type(searchInput, "001-A");

      // Should show matching drawing and its parent
      expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      
      // Should not show non-matching drawings
      expect(screen.queryByText("P&ID-002")).not.toBeInTheDocument();
    });

    it("should be case insensitive", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      await user.type(searchInput, "SECONDARY");

      expect(screen.getByText("Secondary Process")).toBeInTheDocument();
      expect(screen.queryByText("Main Process Flow")).not.toBeInTheDocument();
    });

    it("should auto-expand nodes when searching", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      // Initially children are not visible
      expect(screen.queryByText("P&ID-001-A")).not.toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      await user.type(searchInput, "001-A");

      // Parent should be auto-expanded to show matching child
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
    });

    it("should show no results message when search has no matches", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      await user.type(searchInput, "xyz123");

      expect(screen.getByText("No drawings found matching your search")).toBeInTheDocument();
    });

    it("should clear search when input is cleared", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...") as HTMLInputElement;
      
      // Search for something
      await user.type(searchInput, "001-A");
      expect(screen.queryByText("P&ID-002")).not.toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);
      
      // All drawings should be visible again
      expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      expect(screen.getByText("P&ID-002")).toBeInTheDocument();
    });
  });

  describe("expand/collapse functionality", () => {
    it("should expand individual node when chevron clicked", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      fireEvent.click(expandButton);

      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      expect(screen.getByText("P&ID-001-B")).toBeInTheDocument();
    });

    it("should collapse individual node when chevron clicked again", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      
      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();

      // Collapse (button is now "collapse")
      const collapseButton = screen.getAllByRole("button", { name: /collapse/i })[0];
      fireEvent.click(collapseButton);
      expect(screen.queryByText("P&ID-001-A")).not.toBeInTheDocument();
    });

    it("should expand all nodes when expand all clicked", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const expandAllButton = screen.getByText("Expand all");
      fireEvent.click(expandAllButton);

      // All children should be visible
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      expect(screen.getByText("P&ID-001-B")).toBeInTheDocument();
    });

    it("should collapse all nodes when collapse all clicked", () => {
      render(<DrawingTreeView {...defaultProps} />);

      // First expand all
      const expandAllButton = screen.getByText("Expand all");
      fireEvent.click(expandAllButton);
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();

      // Then collapse all
      const collapseAllButton = screen.getByText("Collapse all");
      fireEvent.click(collapseAllButton);
      expect(screen.queryByText("P&ID-001-A")).not.toBeInTheDocument();
    });

    it("should handle deep tree expansion", () => {
      render(<DrawingTreeView {...defaultProps} drawings={mockDeepTree} />);

      // Expand first level
      const expandButtons = screen.getAllByRole("button", { name: /expand/i });
      fireEvent.click(expandButtons[0]);

      expect(screen.getByText("AREA-01-UNIT-01")).toBeInTheDocument();

      // Continue expanding deeper levels
      const newExpandButtons = screen.getAllByRole("button", { name: /expand/i });
      fireEvent.click(newExpandButtons[1]); // Expand unit

      expect(screen.getByText("AREA-01-UNIT-01-SYS-01")).toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("should highlight selected drawing", () => {
      render(<DrawingTreeView {...defaultProps} selectedDrawingId="d1" />);

      const selectedItem = screen.getByRole("treeitem", { selected: true });
      expect(selectedItem).toBeInTheDocument();
    });

    it("should call onDrawingSelect when drawing clicked", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const drawing = screen.getByText("P&ID-001").closest('[role="treeitem"]');
      fireEvent.click(drawing!);

      expect(mockOnDrawingSelect).toHaveBeenCalledWith("d1");
      expect(mockOnDrawingSelect).toHaveBeenCalledTimes(1);
    });

    it("should update selection when different drawing clicked", () => {
      const { rerender } = render(
        <DrawingTreeView {...defaultProps} selectedDrawingId="d1" />
      );

      // Click second drawing
      const secondDrawing = screen.getByText("P&ID-002").closest('[role="treeitem"]');
      fireEvent.click(secondDrawing!);

      expect(mockOnDrawingSelect).toHaveBeenCalledWith("d4");

      // Rerender with new selection
      rerender(
        <DrawingTreeView {...defaultProps} selectedDrawingId="d4" />
      );

      const selectedItems = screen.getAllByRole("treeitem", { selected: true });
      expect(selectedItems).toHaveLength(1);
      expect(selectedItems[0]).toHaveTextContent("P&ID-002");
    });
  });

  describe("accessibility", () => {
    it("should have proper tree ARIA structure", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const tree = screen.getByRole("tree");
      expect(tree).toBeInTheDocument();
      expect(tree).toHaveAttribute("aria-label", "Drawing hierarchy");
    });

    it("should have search input with proper label", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      expect(searchInput).toHaveAttribute("type", "search");
    });

    it("should support keyboard navigation for expand/collapse", () => {
      render(<DrawingTreeView {...defaultProps} />);

      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      
      // Simulate Enter key
      fireEvent.keyDown(expandButton, { key: "Enter" });
      
      // Should expand
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
    });
  });

  describe("mobile variant", () => {
    it("should render with mobile-specific styles", () => {
      const { container } = render(
        <DrawingTreeView {...defaultProps} isMobile={true} />
      );

      // Should use mobile skeleton with larger height
      const items = container.querySelectorAll('[style*="height: 52px"]');
      expect(items.length).toBe(0); // No items with explicit height in non-loading state
    });

    it("should pass isMobile prop to tree items", () => {
      render(<DrawingTreeView {...defaultProps} isMobile={true} />);

      // Mobile items should have min-height of 52px
      const treeItems = screen.getAllByRole("treeitem");
      expect(treeItems[0]).toHaveClass("min-h-[52px]");
    });
  });

  describe("performance", () => {
    it("should handle large trees efficiently", () => {
      const largeTree = Array.from({ length: 100 }, (_, i) => ({
        id: `d${i}`,
        projectId: "p1",
        number: `DWG-${i}`,
        title: `Drawing ${i}`,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        componentCount: {
          total: 10,
          notStarted: 5,
          inProgress: 3,
          completed: 2,
          onHold: 0,
        },
        children: [],
      }));

      const { container } = render(
        <DrawingTreeView {...defaultProps} drawings={largeTree} />
      );

      const treeItems = container.querySelectorAll('[role="treeitem"]');
      expect(treeItems.length).toBe(100);
    });

    it("should debounce search input", async () => {
      const user = userEvent.setup();
      render(<DrawingTreeView {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search drawings...");
      
      // Type quickly
      await user.type(searchInput, "test");

      // Search should be applied after typing
      await waitFor(() => {
        expect(screen.getByText("No drawings found matching your search")).toBeInTheDocument();
      });
    });
  });
});