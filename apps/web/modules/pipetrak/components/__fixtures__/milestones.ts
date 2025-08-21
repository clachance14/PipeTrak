import type { ComponentMilestone, WorkflowType } from "../../types";

export interface MockMilestoneData {
  id: string;
  componentId: string;
  milestoneName: string;
  milestoneOrder: number;
  isCompleted: boolean;
  percentageComplete: number | null;
  quantityComplete: number | null;
  quantityTotal: number | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const mockMilestones: ComponentMilestone[] = [
  {
    id: "milestone-1",
    componentId: "component-1",
    milestoneName: "Design Review",
    milestoneOrder: 1,
    isCompleted: true,
    percentageComplete: 100,
    quantityComplete: null,
    quantityTotal: null,
    completedAt: new Date("2024-01-15T10:00:00Z"),
    completedBy: "user-123",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    completer: {
      id: "user-123",
      name: "John Foreman",
      email: "john@pipetrak.co"
    }
  },
  {
    id: "milestone-2",
    componentId: "component-1",
    milestoneName: "Material Procurement",
    milestoneOrder: 2,
    isCompleted: false,
    percentageComplete: 75,
    quantityComplete: null,
    quantityTotal: null,
    completedAt: null,
    completedBy: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-20T14:30:00Z"),
    completer: null
  },
  {
    id: "milestone-3",
    componentId: "component-1",
    milestoneName: "Installation",
    milestoneOrder: 3,
    isCompleted: false,
    percentageComplete: 0,
    quantityComplete: 3,
    quantityTotal: 10,
    completedAt: null,
    completedBy: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-22T09:15:00Z"),
    completer: null
  },
  {
    id: "milestone-4",
    componentId: "component-2",
    milestoneName: "Quality Check",
    milestoneOrder: 1,
    isCompleted: false,
    percentageComplete: 0,
    quantityComplete: null,
    quantityTotal: null,
    completedAt: null,
    completedBy: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    completer: null
  }
];

// Factory functions for generating test data
export function createMockMilestone(overrides: Partial<ComponentMilestone> = {}): ComponentMilestone {
  const baseId = Math.random().toString(36).substr(2, 9);
  
  return {
    id: `milestone-${baseId}`,
    componentId: `component-${baseId}`,
    milestoneName: "Test Milestone",
    milestoneOrder: 1,
    isCompleted: false,
    percentageComplete: 0,
    quantityComplete: null,
    quantityTotal: null,
    completedAt: null,
    completedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completer: null,
    ...overrides
  };
}

export function createDiscreteMilestone(overrides: Partial<ComponentMilestone> = {}): ComponentMilestone {
  return createMockMilestone({
    milestoneName: "Design Review",
    isCompleted: false,
    percentageComplete: 0,
    quantityComplete: null,
    quantityTotal: null,
    ...overrides
  });
}

export function createPercentageMilestone(overrides: Partial<ComponentMilestone> = {}): ComponentMilestone {
  return createMockMilestone({
    milestoneName: "Material Procurement",
    isCompleted: false,
    percentageComplete: 45,
    quantityComplete: null,
    quantityTotal: null,
    ...overrides
  });
}

export function createQuantityMilestone(overrides: Partial<ComponentMilestone> = {}): ComponentMilestone {
  return createMockMilestone({
    milestoneName: "Installation",
    isCompleted: false,
    percentageComplete: 0,
    quantityComplete: 3,
    quantityTotal: 10,
    ...overrides
  });
}

export function generateMockMilestones(count: number, componentId?: string): ComponentMilestone[] {
  const milestones: ComponentMilestone[] = [];
  const milestoneTypes = ["Design Review", "Procurement", "Installation", "Testing", "Completion"];
  
  for (let i = 0; i < count; i++) {
    const workflowType: WorkflowType = i % 3 === 0 ? "MILESTONE_DISCRETE" : 
                                       i % 3 === 1 ? "MILESTONE_PERCENTAGE" : 
                                       "MILESTONE_QUANTITY";
    
    let milestone: ComponentMilestone;
    
    if (workflowType === "MILESTONE_DISCRETE") {
      milestone = createDiscreteMilestone({
        id: `milestone-${i}`,
        componentId: componentId || `component-${Math.floor(i / 5)}`,
        milestoneName: milestoneTypes[i % milestoneTypes.length],
        milestoneOrder: (i % 5) + 1,
        isCompleted: Math.random() > 0.7
      });
    } else if (workflowType === "MILESTONE_PERCENTAGE") {
      milestone = createPercentageMilestone({
        id: `milestone-${i}`,
        componentId: componentId || `component-${Math.floor(i / 5)}`,
        milestoneName: milestoneTypes[i % milestoneTypes.length],
        milestoneOrder: (i % 5) + 1,
        percentageComplete: Math.floor(Math.random() * 100)
      });
    } else {
      const total = Math.floor(Math.random() * 20) + 1;
      milestone = createQuantityMilestone({
        id: `milestone-${i}`,
        componentId: componentId || `component-${Math.floor(i / 5)}`,
        milestoneName: milestoneTypes[i % milestoneTypes.length],
        milestoneOrder: (i % 5) + 1,
        quantityTotal: total,
        quantityComplete: Math.floor(Math.random() * total)
      });
    }
    
    milestones.push(milestone);
  }
  
  return milestones;
}

// Mock bulk operation data
export interface MockBulkUpdate {
  componentId: string;
  milestoneName: string;
  workflowType: WorkflowType;
  value: boolean | number;
}

export function createMockBulkUpdate(overrides: Partial<MockBulkUpdate> = {}): MockBulkUpdate {
  return {
    componentId: `component-${Math.random().toString(36).substr(2, 9)}`,
    milestoneName: "Test Milestone",
    workflowType: "MILESTONE_DISCRETE",
    value: true,
    ...overrides
  };
}

export function generateMockBulkUpdates(count: number): MockBulkUpdate[] {
  const updates: MockBulkUpdate[] = [];
  
  for (let i = 0; i < count; i++) {
    const workflowType: WorkflowType = i % 3 === 0 ? "MILESTONE_DISCRETE" : 
                                       i % 3 === 1 ? "MILESTONE_PERCENTAGE" : 
                                       "MILESTONE_QUANTITY";
    
    let value: boolean | number;
    if (workflowType === "MILESTONE_DISCRETE") {
      value = Math.random() > 0.5;
    } else if (workflowType === "MILESTONE_PERCENTAGE") {
      value = Math.floor(Math.random() * 100);
    } else {
      value = Math.floor(Math.random() * 20);
    }
    
    updates.push(createMockBulkUpdate({
      componentId: `component-${Math.floor(i / 3)}`,
      milestoneName: `Milestone ${i % 3 + 1}`,
      workflowType,
      value
    }));
  }
  
  return updates;
}

// Mock API responses
export const mockBulkUpdateResponse = {
  successful: 8,
  failed: 2,
  transactionId: "bulk_1642234567890_abc123",
  results: [
    {
      componentId: "component-1",
      milestoneName: "Design Review",
      success: true,
      milestone: mockMilestones[0]
    },
    {
      componentId: "component-2", 
      milestoneName: "Installation",
      success: false,
      error: "Milestone not found"
    }
  ]
};

export const mockSyncResponse = {
  syncTimestamp: new Date().toISOString(),
  operationsProcessed: 5,
  successful: 4,
  failed: 1,
  results: [
    {
      operationId: "op-1",
      success: true,
      result: mockMilestones[0]
    },
    {
      operationId: "op-2",
      success: false,
      error: "Network error"
    }
  ]
};

export const mockMilestoneStats = {
  milestoneStats: [
    {
      milestoneName: "Design Review",
      total: 100,
      completed: 85,
      avgPercentage: 92.5
    },
    {
      milestoneName: "Installation",
      total: 100,
      completed: 45,
      avgPercentage: 67.8
    }
  ],
  recentUpdates: mockMilestones.slice(0, 3)
};

// Test scenarios data
export const testScenarios = {
  // Large dataset scenario
  largeDataset: generateMockMilestones(1000),
  
  // Conflict scenario
  conflictedMilestone: {
    local: {
      ...mockMilestones[0],
      isCompleted: true,
      updatedAt: new Date("2024-01-20T10:00:00Z")
    },
    remote: {
      ...mockMilestones[0],
      isCompleted: false,
      updatedAt: new Date("2024-01-20T09:00:00Z")
    }
  },
  
  // Offline scenario
  offlineQueue: [
    {
      id: "offline-1",
      componentId: "component-1",
      milestoneId: "milestone-1",
      milestoneName: "Design Review",
      workflowType: "MILESTONE_DISCRETE" as WorkflowType,
      value: true,
      timestamp: Date.now() - 60000 // 1 minute ago
    },
    {
      id: "offline-2",
      componentId: "component-2",
      milestoneId: "milestone-2",
      milestoneName: "Installation",
      workflowType: "MILESTONE_PERCENTAGE" as WorkflowType,
      value: 85,
      timestamp: Date.now() - 30000 // 30 seconds ago
    }
  ]
};

// Performance test data
export const performanceTestData = {
  // Simulated network delays
  delays: {
    fast: 100,
    normal: 500,
    slow: 2000,
    timeout: 10000
  },
  
  // Batch sizes for bulk operations
  batchSizes: [10, 50, 100, 500, 1000],
  
  // Component counts for different scenarios
  componentCounts: {
    small: 10,
    medium: 100,
    large: 1000,
    xlarge: 5000
  }
};