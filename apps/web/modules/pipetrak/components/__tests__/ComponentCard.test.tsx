import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentCard } from "../components/ComponentCard";
import type { ComponentWithMilestones } from "../../types";

const mockComponent: ComponentWithMilestones = {
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
};

describe("ComponentCard", () => {
  it("should render component information", () => {
    const onClick = vi.fn();
    render(<ComponentCard component={mockComponent} onClick={onClick} />);

    // Check main content
    expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
    expect(screen.getByText("Gate Valve - Main Line")).toBeInTheDocument();
    expect(screen.getByText("VALVE")).toBeInTheDocument();
    
    // Check metadata
    expect(screen.getByText("Area 100")).toBeInTheDocument();
    expect(screen.getByText("Cooling Water")).toBeInTheDocument();
    expect(screen.getByText("ANSI 150")).toBeInTheDocument();
    expect(screen.getByText("P-35F11")).toBeInTheDocument();
    
    // Check status
    expect(screen.getByText("NOT STARTED")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ComponentCard component={mockComponent} onClick={onClick} />);
    
    const card = screen.getByText("VALVE-401-0001").closest(".cursor-pointer");
    if (card) {
      await user.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should show quick action button for NOT_STARTED status", () => {
    const onQuickUpdate = vi.fn();
    render(
      <ComponentCard 
        component={mockComponent} 
        onClick={vi.fn()} 
        onQuickUpdate={onQuickUpdate}
      />
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveClass("h-[52px]"); // 52px touch target
  });

  it("should show quick action button for IN_PROGRESS status", () => {
    const onQuickUpdate = vi.fn();
    const inProgressComponent = {
      ...mockComponent,
      status: "IN_PROGRESS" as const,
      completionPercent: 50,
    };
    
    render(
      <ComponentCard 
        component={inProgressComponent} 
        onClick={vi.fn()} 
        onQuickUpdate={onQuickUpdate}
      />
    );

    const completeButton = screen.getByRole("button", { name: /complete/i });
    expect(completeButton).toBeInTheDocument();
    expect(completeButton).toHaveClass("h-[52px]"); // 52px touch target
  });

  it("should not show quick action button for COMPLETED status", () => {
    const onQuickUpdate = vi.fn();
    const completedComponent = {
      ...mockComponent,
      status: "COMPLETED" as const,
      completionPercent: 100,
    };
    
    render(
      <ComponentCard 
        component={completedComponent} 
        onClick={vi.fn()} 
        onQuickUpdate={onQuickUpdate}
      />
    );

    expect(screen.queryByRole("button", { name: /start/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /complete/i })).not.toBeInTheDocument();
  });

  it("should call onQuickUpdate when quick action is clicked", async () => {
    const onQuickUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ComponentCard 
        component={mockComponent} 
        onClick={vi.fn()} 
        onQuickUpdate={onQuickUpdate}
      />
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);
    
    expect(onQuickUpdate).toHaveBeenCalledWith("IN_PROGRESS");
  });

  it("should prevent card click when quick action is clicked", async () => {
    const onClick = vi.fn();
    const onQuickUpdate = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ComponentCard 
        component={mockComponent} 
        onClick={onClick} 
        onQuickUpdate={onQuickUpdate}
      />
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);
    
    expect(onQuickUpdate).toHaveBeenCalledWith("IN_PROGRESS");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should display correct status icon and color", () => {
    // Test NOT_STARTED
    const { rerender } = render(
      <ComponentCard component={mockComponent} onClick={vi.fn()} />
    );
    expect(screen.getByText("NOT STARTED")).toHaveClass("text-fieldPending");

    // Test IN_PROGRESS
    rerender(
      <ComponentCard 
        component={{ ...mockComponent, status: "IN_PROGRESS" as const }} 
        onClick={vi.fn()} 
      />
    );
    expect(screen.getByText("IN PROGRESS")).toHaveClass("text-blue-700");

    // Test COMPLETED
    rerender(
      <ComponentCard 
        component={{ ...mockComponent, status: "COMPLETED" as const }} 
        onClick={vi.fn()} 
      />
    );
    expect(screen.getByText("COMPLETED")).toHaveClass("text-fieldComplete");
  });

  it("should show progress bar with correct value", () => {
    const { rerender } = render(
      <ComponentCard component={mockComponent} onClick={vi.fn()} />
    );
    
    // Check 0% progress
    expect(screen.getByText("0%")).toBeInTheDocument();
    
    // Check 50% progress
    rerender(
      <ComponentCard 
        component={{ ...mockComponent, completionPercent: 50 }} 
        onClick={vi.fn()} 
      />
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    
    // Check 100% progress
    rerender(
      <ComponentCard 
        component={{ ...mockComponent, completionPercent: 100 }} 
        onClick={vi.fn()} 
      />
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should handle missing optional fields gracefully", () => {
    const minimalComponent = {
      ...mockComponent,
      description: undefined,
      spec: undefined,
      area: undefined,
      system: undefined,
      drawingNumber: undefined,
    };
    
    render(<ComponentCard component={minimalComponent} onClick={vi.fn()} />);
    
    // Should still render without errors
    expect(screen.getByText("VALVE-401-0001")).toBeInTheDocument();
    expect(screen.getByText("VALVE")).toBeInTheDocument();
    expect(screen.getByText("NOT STARTED")).toBeInTheDocument();
  });
});