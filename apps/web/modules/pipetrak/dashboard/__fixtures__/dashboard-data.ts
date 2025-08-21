/**
 * Test fixtures for dashboard components
 * Provides mock data for unit and integration tests
 */

import type {
  DashboardMetrics,
  AreaSystemMatrix,
  AreaSystemMatrixItem,
  DrawingRollups,
  DrawingRollup,
  TestPackageReadiness,
  TestPackage,
  RecentActivity,
  ActivityItem,
  DashboardData,
  KPICardData,
} from '../types';

// Small dataset (10 components) - for unit tests
export const smallDashboardMetrics: DashboardMetrics = {
  overallCompletionPercent: 60.0,
  totalComponents: 10,
  completedComponents: 6,
  activeDrawings: 2,
  testPackagesReady: 1,
  stalledComponents: {
    stalled7Days: 1,
    stalled14Days: 1,
    stalled21Days: 0,
  },
  generatedAt: Date.now(),
};

// Medium dataset (100 components) - for integration tests
export const mediumDashboardMetrics: DashboardMetrics = {
  overallCompletionPercent: 75.0,
  totalComponents: 100,
  completedComponents: 75,
  activeDrawings: 8,
  testPackagesReady: 3,
  stalledComponents: {
    stalled7Days: 5,
    stalled14Days: 3,
    stalled21Days: 2,
  },
  generatedAt: Date.now(),
};

// Large dataset (1000 components) - for performance tests
export const largeDashboardMetrics: DashboardMetrics = {
  overallCompletionPercent: 68.5,
  totalComponents: 1000,
  completedComponents: 685,
  activeDrawings: 25,
  testPackagesReady: 8,
  stalledComponents: {
    stalled7Days: 45,
    stalled14Days: 28,
    stalled21Days: 15,
  },
  generatedAt: Date.now(),
};

// Stress test dataset (10000 components)
export const stressDashboardMetrics: DashboardMetrics = {
  overallCompletionPercent: 72.3,
  totalComponents: 10000,
  completedComponents: 7230,
  activeDrawings: 150,
  testPackagesReady: 45,
  stalledComponents: {
    stalled7Days: 350,
    stalled14Days: 280,
    stalled21Days: 120,
  },
  generatedAt: Date.now(),
};

// Edge cases
export const emptyDashboardMetrics: DashboardMetrics = {
  overallCompletionPercent: 0.0,
  totalComponents: 0,
  completedComponents: 0,
  activeDrawings: 0,
  testPackagesReady: 0,
  stalledComponents: {
    stalled7Days: 0,
    stalled14Days: 0,
    stalled21Days: 0,
  },
  generatedAt: Date.now(),
};

export const allCompletedMetrics: DashboardMetrics = {
  overallCompletionPercent: 100.0,
  totalComponents: 50,
  completedComponents: 50,
  activeDrawings: 5,
  testPackagesReady: 5,
  stalledComponents: {
    stalled7Days: 0,
    stalled14Days: 0,
    stalled21Days: 0,
  },
  generatedAt: Date.now(),
};

export const allStalledMetrics: DashboardMetrics = {
  overallCompletionPercent: 0.0,
  totalComponents: 30,
  completedComponents: 0,
  activeDrawings: 5,
  testPackagesReady: 0,
  stalledComponents: {
    stalled7Days: 10,
    stalled14Days: 10,
    stalled21Days: 10,
  },
  generatedAt: Date.now(),
};

// Area/System Matrix Data
export const smallAreaSystemMatrix: AreaSystemMatrix = {
  matrixData: [
    {
      area: 'Area-01',
      system: 'System-01',
      totalCount: 5,
      completedCount: 3,
      completionPercent: 60.0,
      stalledCounts: {
        stalled7Days: 1,
        stalled14Days: 0,
        stalled21Days: 0,
      },
    },
    {
      area: 'Area-01',
      system: 'System-02',
      totalCount: 3,
      completedCount: 2,
      completionPercent: 66.7,
      stalledCounts: {
        stalled7Days: 0,
        stalled14Days: 1,
        stalled21Days: 0,
      },
    },
    {
      area: 'Area-02',
      system: 'System-01',
      totalCount: 2,
      completedCount: 1,
      completionPercent: 50.0,
      stalledCounts: {
        stalled7Days: 0,
        stalled14Days: 0,
        stalled21Days: 0,
      },
    },
  ],
  generatedAt: Date.now(),
};

export const largeAreaSystemMatrix: AreaSystemMatrix = {
  matrixData: Array.from({ length: 100 }, (_, index) => ({
    area: `Area-${String(Math.floor(index / 10) + 1).padStart(2, '0')}`,
    system: `System-${String((index % 10) + 1).padStart(2, '0')}`,
    totalCount: Math.floor(Math.random() * 50) + 10,
    completedCount: Math.floor(Math.random() * 40) + 5,
    completionPercent: Math.floor(Math.random() * 100),
    stalledCounts: {
      stalled7Days: Math.floor(Math.random() * 5),
      stalled14Days: Math.floor(Math.random() * 3),
      stalled21Days: Math.floor(Math.random() * 2),
    },
  })),
  generatedAt: Date.now(),
};

// Drawing Rollups Data
export const smallDrawingRollups: DrawingRollups = {
  drawings: [
    {
      drawingId: 'drawing-1',
      drawingNumber: 'DWG-001',
      drawingName: 'Main Process Flow',
      parentDrawingId: null,
      componentCount: 5,
      completedCount: 3,
      completionPercent: 60.0,
      stalledCount: 1,
    },
    {
      drawingId: 'drawing-2',
      drawingNumber: 'DWG-002',
      drawingName: 'Auxiliary Systems',
      parentDrawingId: null,
      componentCount: 3,
      completedCount: 2,
      completionPercent: 66.7,
      stalledCount: 0,
    },
    {
      drawingId: 'drawing-3',
      drawingNumber: 'DWG-003',
      drawingName: 'Control Panel Detail',
      parentDrawingId: 'drawing-1',
      componentCount: 2,
      completedCount: 1,
      completionPercent: 50.0,
      stalledCount: 1,
    },
  ],
  generatedAt: Date.now(),
};

// Test Package Data
export const smallTestPackageReadiness: TestPackageReadiness = {
  testPackages: [
    {
      packageId: 'PKG-001',
      packageName: 'Pressure Test Package A',
      totalComponents: 5,
      completedComponents: 5,
      completionPercent: 100.0,
      isReady: true,
      stalledCount: 0,
    },
    {
      packageId: 'PKG-002',
      packageName: 'Leak Test Package B',
      totalComponents: 3,
      completedComponents: 2,
      completionPercent: 66.7,
      isReady: false,
      stalledCount: 1,
    },
    {
      packageId: 'PKG-003',
      packageName: 'Function Test Package C',
      totalComponents: 2,
      completedComponents: 0,
      completionPercent: 0.0,
      isReady: false,
      stalledCount: 2,
    },
  ],
  generatedAt: Date.now(),
};

// Recent Activity Data
export const smallRecentActivity: RecentActivity = {
  activities: [
    {
      activityType: 'milestone_completed',
      timestamp: Date.now() - 3600000, // 1 hour ago
      userId: 'user-1',
      userName: 'John Smith',
      componentId: 'VALVE-001',
      componentType: 'Ball Valve',
      milestoneName: 'Installation',
      details: {
        componentId: 'VALVE-001',
        componentType: 'Ball Valve',
        milestoneName: 'Installation',
        completionPercent: 60,
        action: 'milestone_completed',
      },
    },
    {
      activityType: 'component_updated',
      timestamp: Date.now() - 7200000, // 2 hours ago
      userId: 'user-2',
      userName: 'Jane Doe',
      componentId: 'PIPE-002',
      componentType: 'Steel Pipe',
      milestoneName: null,
      details: {
        componentId: 'PIPE-002',
        componentType: 'Steel Pipe',
        action: 'component_updated',
        changes: {
          status: 'IN_PROGRESS',
        },
      },
    },
    {
      activityType: 'milestone_completed',
      timestamp: Date.now() - 14400000, // 4 hours ago
      userId: 'user-1',
      userName: 'John Smith',
      componentId: 'FITTING-003',
      componentType: 'Elbow Fitting',
      milestoneName: 'Quality Check',
      details: {
        componentId: 'FITTING-003',
        componentType: 'Elbow Fitting',
        milestoneName: 'Quality Check',
        completionPercent: 80,
        action: 'milestone_completed',
      },
    },
  ],
  generatedAt: Date.now(),
  limit: 50,
};

// KPI Card Data
export const sampleKPICards: KPICardData[] = [
  {
    title: 'Overall Completion',
    value: '75%',
    subtitle: '750 of 1000 components',
    variant: 'primary',
    trend: {
      direction: 'up',
      value: '5%',
      period: 'this week',
    },
  },
  {
    title: 'Test Packages Ready',
    value: 8,
    subtitle: 'out of 12 packages',
    variant: 'primary',
  },
  {
    title: 'Stalled Components',
    value: 45,
    subtitle: '7+ days without progress',
    variant: 'secondary',
    trend: {
      direction: 'down',
      value: '3',
      period: 'since yesterday',
    },
  },
  {
    title: 'Active Drawings',
    value: 25,
    subtitle: 'with incomplete components',
    variant: 'primary',
  },
];

// Complete Dashboard Data Sets
export const smallDashboardData: DashboardData = {
  metrics: smallDashboardMetrics,
  areaSystemMatrix: smallAreaSystemMatrix,
  drawingRollups: smallDrawingRollups,
  testPackageReadiness: smallTestPackageReadiness,
  recentActivity: smallRecentActivity,
  project: {
    id: 'project-1',
    jobName: 'Small Test Project',
    description: 'Small project for unit testing',
    status: 'ACTIVE',
    organizationId: 'org-1',
  },
};

export const emptyDashboardData: DashboardData = {
  metrics: emptyDashboardMetrics,
  areaSystemMatrix: { matrixData: [], generatedAt: Date.now() },
  drawingRollups: { drawings: [], generatedAt: Date.now() },
  testPackageReadiness: { testPackages: [], generatedAt: Date.now() },
  recentActivity: { activities: [], generatedAt: Date.now(), limit: 50 },
  project: {
    id: 'project-empty',
    jobName: 'Empty Test Project',
    description: 'Project with no components',
    status: 'ACTIVE',
    organizationId: 'org-1',
  },
};

// Loading state data
export const loadingDashboardData: DashboardData = {
  metrics: null,
  areaSystemMatrix: null,
  drawingRollups: null,
  testPackageReadiness: null,
  recentActivity: null,
  project: null,
};

// Error state mock data generators
export function createErrorResponse(message: string) {
  return {
    error: message,
    code: 'DASHBOARD_ERROR',
    details: {
      timestamp: Date.now(),
      request: 'dashboard_data',
    },
  };
}

// Mock data generators for dynamic testing
export function generateDashboardMetrics(componentCount: number): DashboardMetrics {
  const completedCount = Math.floor(componentCount * (0.6 + Math.random() * 0.3)); // 60-90% completion
  const stalledTotal = Math.floor(componentCount * 0.1); // ~10% stalled
  
  return {
    overallCompletionPercent: Math.round((completedCount / componentCount) * 100 * 100) / 100,
    totalComponents: componentCount,
    completedComponents: completedCount,
    activeDrawings: Math.ceil(componentCount / 40), // ~25 components per drawing
    testPackagesReady: Math.floor(componentCount / 50), // ~50 components per package
    stalledComponents: {
      stalled7Days: Math.floor(stalledTotal * 0.5),
      stalled14Days: Math.floor(stalledTotal * 0.3),
      stalled21Days: Math.floor(stalledTotal * 0.2),
    },
    generatedAt: Date.now(),
  };
}

export function generateAreaSystemMatrix(areaCount: number, systemCount: number): AreaSystemMatrix {
  const matrixData: AreaSystemMatrixItem[] = [];
  
  for (let a = 1; a <= areaCount; a++) {
    for (let s = 1; s <= systemCount; s++) {
      const totalCount = Math.floor(Math.random() * 20) + 5;
      const completedCount = Math.floor(totalCount * (0.5 + Math.random() * 0.4));
      
      matrixData.push({
        area: `Area-${String(a).padStart(2, '0')}`,
        system: `System-${String(s).padStart(2, '0')}`,
        totalCount,
        completedCount,
        completionPercent: Math.round((completedCount / totalCount) * 100 * 100) / 100,
        stalledCounts: {
          stalled7Days: Math.floor(Math.random() * 3),
          stalled14Days: Math.floor(Math.random() * 2),
          stalled21Days: Math.floor(Math.random() * 1),
        },
      });
    }
  }
  
  return {
    matrixData,
    generatedAt: Date.now(),
  };
}

export function generateRecentActivity(activityCount: number): RecentActivity {
  const activities: ActivityItem[] = [];
  const users = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Johnson'];
  const componentTypes = ['Ball Valve', 'Gate Valve', 'Pipe Section', 'Elbow Fitting', 'Reducer'];
  const milestones = ['Design Review', 'Material Procurement', 'Installation', 'Quality Check', 'Completion'];
  
  for (let i = 0; i < activityCount; i++) {
    const isCompleted = Math.random() > 0.5;
    const componentId = `COMP-${String(i + 1).padStart(3, '0')}`;
    const componentType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
    const userName = users[Math.floor(Math.random() * users.length)];
    const milestoneName = isCompleted ? milestones[Math.floor(Math.random() * milestones.length)] : null;
    
    activities.push({
      activityType: isCompleted ? 'milestone_completed' : 'component_updated',
      timestamp: Date.now() - (i * 3600000), // Space activities 1 hour apart
      userId: `user-${Math.floor(Math.random() * 4) + 1}`,
      userName,
      componentId,
      componentType,
      milestoneName,
      details: {
        componentId,
        componentType,
        milestoneName: milestoneName || undefined,
        completionPercent: isCompleted ? Math.floor(Math.random() * 100) + 1 : undefined,
        action: isCompleted ? 'milestone_completed' : 'component_updated',
        changes: isCompleted ? undefined : {
          status: 'IN_PROGRESS',
        },
      },
    });
  }
  
  return {
    activities,
    generatedAt: Date.now(),
    limit: activityCount,
  };
}

// Mock API response delay simulator
export function simulateApiDelay(minMs = 100, maxMs = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Test data validation helpers
export function validateDashboardMetrics(metrics: DashboardMetrics): boolean {
  return (
    typeof metrics.totalComponents === 'number' &&
    typeof metrics.completedComponents === 'number' &&
    typeof metrics.overallCompletionPercent === 'number' &&
    metrics.completedComponents <= metrics.totalComponents &&
    metrics.overallCompletionPercent >= 0 &&
    metrics.overallCompletionPercent <= 100
  );
}

export function validateAreaSystemMatrix(matrix: AreaSystemMatrix): boolean {
  return (
    Array.isArray(matrix.matrixData) &&
    matrix.matrixData.every(item => 
      typeof item.totalCount === 'number' &&
      typeof item.completedCount === 'number' &&
      item.completedCount <= item.totalCount
    )
  );
}