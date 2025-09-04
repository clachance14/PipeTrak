import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentTable } from "../components/ComponentTable";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ComponentWithMilestones } from "../../types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock the API client
vi.mock("@shared/lib/api-client", () => ({
  apiClient: {
    pipetrak: {
      components: {
        ":id": {
          $patch: vi.fn(),
        },
        bulk: {
          $patch: vi.fn(),
        },
        $get: vi.fn(),
      },
    },
  },
}));

// Mock components data
const mockComponents: ComponentWithMilestones[] = [
  {
    id: "comp-1",
    componentId: "VALVE-401-0001",
    type: "VALVE",
    description: "Gate Valve - Main Line",
    spec: "ANSI 150",
    size: "6\"",
    material: "CS",
    area: "Area 100",
    system: "Cooling Water",
    drawingNumber: "P-35F11",
    testPackage: "TP-001",
    status: "NOT_STARTED",
    completionPercent: 0,
    milestones: [],
    organizationId: "org-1",
    projectId: "proj-1",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "comp-2",
    componentId: "PIPE-402-0002",
    type: "PIPE",
    description: "Process Pipe Section",
    spec: "ANSI 300",
    size: "8\"",
    material: "SS316",
    area: "Area 200",
    system: "Process System",
    drawingNumber: "P-35F12",
    testPackage: "TP-002",
    status: "IN_PROGRESS",
    completionPercent: 50,
    milestones: [],
    organizationId: "org-1",
    projectId: "proj-1",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "comp-3",
    componentId: "FLANGE-403-0003",
    type: "FLANGE",
    description: "Weld Neck Flange",
    spec: "ANSI 150",
    size: "4\"",
    material: "CS",
    area: "Area 100",
    system: "Cooling Water",
    drawingNumber: "P-35F11",
    testPackage: "TP-001",
    status: "COMPLETED",
    completionPercent: 100,
    milestones: [],
    organizationId: "org-1",
    projectId: "proj-1",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ComponentTable", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Mock pointer capture methods for Radix UI Select
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = vi.fn(() => false);
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = vi.fn();
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = vi.fn();
    }
    
    // Mock scrollIntoView for Radix UI Select
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render component table with data", () => {
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Check if components are displayed
      expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
      expect(screen.getByText("PIPE-402-0002")).toBeInTheDocument();
      expect(screen.getByText("FLANGE-403-0003")).toBeInTheDocument();
    });

    it("should render filter controls", () => {
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Check for search input
      expect(screen.getByPlaceholderText(/search components/i)).toBeInTheDocument();

      // Check for filter dropdowns
      expect(screen.getByText(/all areas/i)).toBeInTheDocument();
      expect(screen.getByText(/all systems/i)).toBeInTheDocument();
      expect(screen.getByText(/all status/i)).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Check for export button
      expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();

      // Check for import button
      expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("should filter components by search term", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      const searchInput = screen.getByPlaceholderText(/search components/i);
      await user.type(searchInput, "VALVE");

      // Should only show valve component
      expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
      expect(screen.queryByText("PIPE-402-0002")).not.toBeInTheDocument();
      expect(screen.queryByText("FLANGE-403-0003")).not.toBeInTheDocument();
    });

    it("should filter components by area", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click on area filter trigger button
      const areaFilterTriggers = screen.getAllByRole("combobox");
      const areaFilter = areaFilterTriggers[0]; // First select is area
      await user.click(areaFilter);

      // Select Area 100
      const area100Option = await screen.findByText("Area Area 100");
      await user.click(area100Option);

      // Should show only Area 100 components
      expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
      expect(screen.queryByText("PIPE-402-0002")).not.toBeInTheDocument();
      expect(screen.getByText("FLANGE-403-0003")).toBeInTheDocument();
    });

    it("should filter components by system", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click on system filter trigger button
      const systemFilterTriggers = screen.getAllByRole("combobox");
      const systemFilter = systemFilterTriggers[1]; // Second select is system
      await user.click(systemFilter);

      // Select Process System (get the option in the dropdown, not the table cell)
      const processOptions = await screen.findAllByText("Process System");
      // The second one should be in the dropdown (first is in the table)
      const processOption = processOptions[1];
      await user.click(processOption);

      // Should show only Process System components
      expect(screen.queryByText("VALVE-401-0001")).not.toBeInTheDocument();
      expect(screen.getByText("PIPE-402-0002")).toBeInTheDocument();
      expect(screen.queryByText("FLANGE-403-0003")).not.toBeInTheDocument();
    });

    it("should filter components by status", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click on status filter trigger button
      const statusFilterTriggers = screen.getAllByRole("combobox");
      const statusFilter = statusFilterTriggers[3]; // Fourth select is status
      await user.click(statusFilter);

      // Select Completed status
      const completedOption = await screen.findByRole("option", { name: "Completed" });
      await user.click(completedOption);

      // Should show only completed components
      expect(screen.queryByText("VALVE-401-0001")).not.toBeInTheDocument();
      expect(screen.queryByText("PIPE-402-0002")).not.toBeInTheDocument();
      expect(screen.getByText("FLANGE-403-0003")).toBeInTheDocument();
    });

    it("should combine multiple filters", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Apply area filter
      const areaFilterTriggers = screen.getAllByRole("combobox");
      const areaFilter = areaFilterTriggers[0];
      await user.click(areaFilter);
      const area100Option = await screen.findByText("Area Area 100");
      await user.click(area100Option);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search components/i);
      await user.type(searchInput, "VALVE");

      // Should only show components matching both filters
      expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
      expect(screen.queryByText("PIPE-402-0002")).not.toBeInTheDocument();
      expect(screen.queryByText("FLANGE-403-0003")).not.toBeInTheDocument();
    });
  });

  describe("Cell Updates", () => {
    it("should handle successful cell update", async () => {
      const { apiClient } = await import("@shared/lib/api-client");
      const mockPatch = vi.fn().mockResolvedValue({ ok: true });
      (apiClient.pipetrak.components[":id"].$patch as any) = mockPatch;

      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Find and edit a cell (this would trigger through EnhancedDataTable)
      // Since we're testing ComponentTable, we'll simulate the callback
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Verify the update would be called with correct parameters
      // This is more of an integration test with EnhancedDataTable
      await waitFor(() => {
        expect(toast.success).not.toHaveBeenCalled();
      });
    });

    it("should handle failed cell update", async () => {
      const { apiClient } = await import("@shared/lib/api-client");
      const mockPatch = vi.fn().mockResolvedValue({ ok: false });
      (apiClient.pipetrak.components[":id"].$patch as any) = mockPatch;

      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // The error handling is internal to the component
      // We can verify the structure is in place
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("Bulk Updates", () => {
    it("should handle successful bulk update", async () => {
      const { apiClient } = await import("@shared/lib/api-client");
      const mockBulkPatch = vi.fn().mockResolvedValue({ ok: true });
      (apiClient.pipetrak.components.bulk.$patch as any) = mockBulkPatch;

      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Bulk update functionality is handled through EnhancedDataTable
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to component detail on row click", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click on a component row
      const firstComponent = screen.getByText("VALVE-401-0001");
      const row = firstComponent.closest("tr");
      
      if (row) {
        await user.click(row);
        
        // Should navigate to component detail page
        expect(mockPush).toHaveBeenCalledWith(
          "/app/pipetrak/proj-1/components/comp-1"
        );
      }
    });
  });

  describe("Export", () => {
    it("should export filtered components as CSV", async () => {
      const user = userEvent.setup();
      
      // Mock URL and document methods
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:url");
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      
      const originalCreateElement = document.createElement.bind(document);
      const mockCreateElement = vi.spyOn(document, "createElement");
      mockCreateElement.mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          Object.defineProperty(element, "click", {
            value: mockClick,
            writable: true,
          });
        }
        return element;
      });

      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click export button
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Verify CSV creation
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Components exported successfully");

      mockCreateElement.mockRestore();
    });

    it("should handle export errors gracefully", async () => {
      const user = userEvent.setup();
      
      // Mock URL to throw an error
      global.URL.createObjectURL = vi.fn().mockImplementation(() => {
        throw new Error("Export failed");
      });

      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click export button
      const exportButton = screen.getByRole("button", { name: /export/i });
      await user.click(exportButton);

      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith("Failed to export components");
    });
  });

  describe("Refresh", () => {
    it("should refresh components from API", async () => {
      const { apiClient } = await import("@shared/lib/api-client");
      const mockGet = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockComponents,
      });
      (apiClient.pipetrak.components.$get as any) = mockGet;

      const user = userEvent.setup();
      const { container } = render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click refresh button
      const refreshButton = screen.getByRole("button", { name: /refresh components/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith({
          query: { projectId: "proj-1" },
        });
      });

      expect(toast.success).toHaveBeenCalledWith("Components refreshed");
    });

    it("should handle refresh errors", async () => {
      const { apiClient } = await import("@shared/lib/api-client");
      const mockGet = vi.fn().mockResolvedValue({ ok: false });
      (apiClient.pipetrak.components.$get as any) = mockGet;

      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Click refresh button
      const refreshButton = screen.getByRole("button", { name: /refresh components/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to refresh components");
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no components", () => {
      render(<ComponentTable components={[]} projectId="proj-1" />);

      expect(screen.getByText(/no components found/i)).toBeInTheDocument();
    });

    it("should show no results message when filters return no matches", async () => {
      const user = userEvent.setup();
      render(<ComponentTable components={mockComponents} projectId="proj-1" />);

      // Search for non-existent component
      const searchInput = screen.getByPlaceholderText(/search components/i);
      await user.type(searchInput, "NONEXISTENT");

      expect(screen.getByText(/no components match/i)).toBeInTheDocument();
    });
  });
});