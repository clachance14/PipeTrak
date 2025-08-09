import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import userEvent from "@testing-library/user-event";
import { DrawingTreeView } from "../components/DrawingTreeView";
import { DrawingSearchDialog } from "../components/DrawingSearchDialog";
import { useDrawingHierarchy } from "../hooks/useDrawingHierarchy";
import { allDrawingHandlers } from "../__mocks__/msw-handlers";

// Setup MSW server
const server = setupServer(...allDrawingHandlers);

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Complete navigation component for integration testing
function DrawingNavigationTest({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useDrawingHierarchy(projectId);
  const [selectedDrawingId, setSelectedDrawingId] = React.useState<string>();
  const [searchOpen, setSearchOpen] = React.useState(false);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <div>
      <button onClick={() => setSearchOpen(true)}>Open Search</button>
      
      <DrawingTreeView
        drawings={data?.data || []}
        selectedDrawingId={selectedDrawingId}
        onDrawingSelect={setSelectedDrawingId}
        isLoading={isLoading}
      />
      
      <DrawingSearchDialog
        projectId={projectId}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onDrawingSelect={setSelectedDrawingId}
      />
      
      {selectedDrawingId && (
        <div data-testid="selected-drawing">
          Selected: {selectedDrawingId}
        </div>
      )}
    </div>
  );
}

describe("Drawing Navigation Integration", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  describe("complete navigation flow", () => {
    it("should load hierarchy and allow navigation", async () => {
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Verify both root drawings are displayed
      expect(screen.getByText("P&ID-002")).toBeInTheDocument();

      // Expand first drawing
      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      fireEvent.click(expandButton);

      // Verify children are shown
      await waitFor(() => {
        expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
        expect(screen.getByText("P&ID-001-B")).toBeInTheDocument();
      });

      // Select a child drawing
      const childDrawing = screen.getByText("P&ID-001-A").closest('[role="treeitem"]');
      fireEvent.click(childDrawing!);

      // Verify selection is tracked
      expect(screen.getByTestId("selected-drawing")).toHaveTextContent("Selected: d2");
    });

    it("should handle search and selection", async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Open search dialog
      const searchButton = screen.getByText("Open Search");
      await user.click(searchButton);

      // Search for a drawing
      const searchInput = await screen.findByPlaceholderText(/search by drawing/i);
      await user.type(searchInput, "P&ID");

      // Wait for search results
      await waitFor(() => {
        const results = screen.getAllByText(/P&ID/);
        expect(results.length).toBeGreaterThan(0);
      });

      // Select first result
      const firstResult = screen.getAllByRole("option")[0];
      await user.click(firstResult);

      // Verify selection
      await waitFor(() => {
        expect(screen.getByTestId("selected-drawing")).toBeInTheDocument();
      });
    });

    it("should handle empty project", async () => {
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="empty" />
        </TestWrapper>
      );

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText("No drawings available")).toBeInTheDocument();
      });
    });

    it("should handle access denied", async () => {
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="unauthorized" />
        </TestWrapper>
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe("tree interaction with API", () => {
    it("should maintain expanded state during selection", async () => {
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Expand tree
      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      });

      // Select parent
      const parentDrawing = screen.getByText("P&ID-001").closest('[role="treeitem"]');
      fireEvent.click(parentDrawing!);

      // Children should still be visible
      expect(screen.getByText("P&ID-001-A")).toBeInTheDocument();
      expect(screen.getByText("P&ID-001-B")).toBeInTheDocument();
    });

    it("should filter tree based on search", async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Search in tree
      const treeSearchInput = screen.getByPlaceholderText("Search drawings...");
      await user.type(treeSearchInput, "Secondary");

      // Only matching drawing should be visible
      await waitFor(() => {
        expect(screen.getByText("Secondary Process")).toBeInTheDocument();
        expect(screen.queryByText("Main Process Flow")).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(treeSearchInput);

      // All drawings should be visible again
      await waitFor(() => {
        expect(screen.getByText("Main Process Flow")).toBeInTheDocument();
        expect(screen.getByText("Secondary Process")).toBeInTheDocument();
      });
    });
  });

  describe("performance with large datasets", () => {
    it("should handle large tree efficiently", async () => {
      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="large" />
        </TestWrapper>
      );

      // Wait for large dataset to load
      await waitFor(() => {
        expect(screen.getByText("DWG-001")).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify multiple drawings loaded
      const drawings = screen.getAllByRole("treeitem");
      expect(drawings.length).toBeGreaterThan(50);

      // Test expand performance
      const startTime = performance.now();
      const expandAllButton = screen.getByText("Expand all");
      fireEvent.click(expandAllButton);

      const endTime = performance.now();
      const expandTime = endTime - startTime;

      // Should expand within reasonable time
      expect(expandTime).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe("error recovery", () => {
    it("should show error state on network failure", async () => {
      // Override handler to simulate network error
      server.use(
        ...allDrawingHandlers.map(handler => {
          return {
            ...handler,
            resolver: () => {
              throw new Error("Network error");
            },
          };
        })
      );

      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it("should recover from temporary errors", async () => {
      let callCount = 0;
      
      server.use(
        ...allDrawingHandlers.map(handler => {
          return {
            ...handler,
            resolver: (req: any, res: any, ctx: any) => {
              callCount++;
              if (callCount === 1) {
                return res(ctx.status(500), ctx.json({ error: "Server error" }));
              }
              return handler.resolver(req, res, ctx);
            },
          };
        })
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: 1, retryDelay: 0 },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <DrawingNavigationTest projectId="p1" />
        </QueryClientProvider>
      );

      // Should eventually load after retry
      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe("responsive behavior", () => {
    it("should switch between mobile and desktop layouts", async () => {
      // Mock window.matchMedia for mobile
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === "(max-width: 768px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Mobile-specific elements should be present
      const treeItems = screen.getAllByRole("treeitem");
      expect(treeItems[0]).toHaveClass("min-h-[52px]");

      // Switch to desktop
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      // Force re-render
      const { rerender } = render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      // Desktop-specific elements should be present
      expect(screen.getByText("Expand all")).toBeInTheDocument();
    });
  });

  describe("data synchronization", () => {
    it("should update tree when data changes", async () => {
      const { rerender } = render(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });

      // Simulate data change by changing project
      rerender(
        <TestWrapper>
          <DrawingNavigationTest projectId="empty" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("No drawings available")).toBeInTheDocument();
      });

      // Change back
      rerender(
        <TestWrapper>
          <DrawingNavigationTest projectId="p1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("P&ID-001")).toBeInTheDocument();
      });
    });
  });
});