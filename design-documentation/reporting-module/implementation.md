# Implementation Guide - Reporting Module

Technical implementation guide for integrating the PipeTrak reporting module with Supastarter's Next.js App Router, shadcn/ui components, and associated patterns.

## Architecture Overview

### Supastarter Integration Points
- **Next.js App Router**: Server-side rendering for reports
- **Hono RPC + TanStack Query**: API data fetching patterns
- **better-auth**: Authentication and session management
- **Organizations**: Multi-tenant data scoping
- **shadcn/ui**: Component library for consistent UI
- **next-intl**: Internationalization for all UI text
- **Tailwind CSS**: Styling with design tokens

### File Structure
```
apps/web/
├── app/(saas)/app/pipetrak/[projectId]/
│   ├── reports/
│   │   ├── page.tsx                    # Reports landing
│   │   ├── progress/page.tsx            # Progress dashboard
│   │   ├── components/page.tsx          # Component report
│   │   ├── test-packages/page.tsx       # Test package readiness
│   │   ├── trends/page.tsx              # Trend analysis
│   │   └── audit/page.tsx               # Audit trail
│   └── layout.tsx                   # Project layout
├── modules/pipetrak/reports/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── ReportsLandingPage.tsx
│   │   │   ├── ReportTypeCards.tsx
│   │   │   └── QuickMetricsBar.tsx
│   │   ├── progress/
│   │   │   ├── ProgressDashboard.tsx
│   │   │   ├── ROCHeroBar.tsx
│   │   │   ├── AreaSystemBreakdown.tsx
│   │   │   └── ProgressCharts.tsx
│   │   ├── components-report/
│   │   │   ├── ComponentReportInterface.tsx
│   │   │   ├── AdvancedFilterPanel.tsx
│   │   │   ├── VirtualizedDataTable.tsx
│   │   │   └── ColumnCustomization.tsx
│   │   ├── test-packages/
│   │   │   ├── TestPackageReadiness.tsx
│   │   │   ├── StatusIndicatorGrid.tsx
│   │   │   └── BlockingComponentDrilldown.tsx
│   │   ├── trends/
│   │   │   ├── TrendAnalysisDashboard.tsx
│   │   │   ├── TimeRangeSelector.tsx
│   │   │   ├── VelocityChart.tsx
│   │   │   └── BottleneckHeatmap.tsx
│   │   └── shared/
│   │       ├── ExportDialog.tsx
│   │       ├── PrintOptimizedView.tsx
│   │       ├── MobileBottomSheet.tsx
│   │       └── OfflineIndicator.tsx
│   ├── hooks/
│   │   ├── useProgressReport.ts
│   │   ├── useComponentReport.ts
│   │   ├── useTestPackageReadiness.ts
│   │   ├── useTrendAnalysis.ts
│   │   ├── useExportGeneration.ts
│   │   └── useReportCache.ts
│   ├── lib/
│   │   ├── report-utils.ts
│   │   ├── roc-calculations.ts
│   │   ├── export-formatters.ts
│   │   └── chart-configs.ts
│   └── types.ts
└── messages/
    ├── en.json                       # English translations
    └── [locale].json                 # Other language files
```

---

## Next.js App Router Implementation

### Reports Landing Page
```typescript
// apps/web/app/(saas)/app/pipetrak/[projectId]/reports/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@saas/auth/lib/server';
import { getActiveOrganization } from '@saas/organizations/lib/server';
import { ReportsLandingPage } from '@pipetrak/reports/components/landing/ReportsLandingPage';
import { getProjectMetrics } from '@pipetrak/reports/lib/data-loaders';

interface ReportsPageProps {
  params: {
    organizationSlug: string;
    projectId: string;
  };
}

export default async function ReportsPage({
  params: { organizationSlug, projectId }
}: ReportsPageProps) {
  // Authentication check
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Organization membership verification
  const organization = await getActiveOrganization(organizationSlug);
  if (!organization) {
    notFound();
  }

  // Load initial data server-side
  const quickMetrics = await getProjectMetrics({
    projectId,
    organizationId: organization.id,
    userId: session.user.id,
  });

  return (
    <ReportsLandingPage
      projectId={projectId}
      organizationId={organization.id}
      quickMetrics={quickMetrics}
      userRole={session.user.role}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ReportsPageProps) {
  return {
    title: 'Reports - PipeTrak',
    description: 'Generate comprehensive project reports with real-time data',
  };
}
```

### Progress Dashboard Page
```typescript
// apps/web/app/(saas)/app/pipetrak/[projectId]/reports/progress/page.tsx
import { Suspense } from 'react';
import { ProgressDashboard } from '@pipetrak/reports/components/progress/ProgressDashboard';
import { ProgressDashboardSkeleton } from '@pipetrak/reports/components/progress/ProgressDashboardSkeleton';
import { getProgressData } from '@pipetrak/reports/lib/data-loaders';

interface ProgressPageProps {
  params: {
    organizationSlug: string;
    projectId: string;
  };
  searchParams: {
    timeRange?: string;
    area?: string;
    system?: string;
  };
}

export default async function ProgressPage({
  params: { organizationSlug, projectId },
  searchParams,
}: ProgressPageProps) {
  const session = await getSession();
  const organization = await getActiveOrganization(organizationSlug);

  // Server-side data loading with filters
  const progressData = await getProgressData({
    projectId,
    organizationId: organization.id,
    filters: searchParams,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress Report</h1>
          <p className="text-muted-foreground">
            ROC-weighted progress with area and system breakdown
          </p>
        </div>
      </div>

      <Suspense fallback={<ProgressDashboardSkeleton />}>
        <ProgressDashboard
          projectId={projectId}
          organizationId={organization.id}
          initialData={progressData}
          filters={searchParams}
        />
      </Suspense>
    </div>
  );
}
```

---

## Hono RPC + TanStack Query Integration

### API Route Structure
```typescript
// packages/api/src/routes/pipetrak/reports.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import { organizationMiddleware } from '../organizations/middleware';
import { validator } from 'hono/validator';

const reportsRouter = new Hono()
  .use(authMiddleware)
  .use(organizationMiddleware)
  
  // Progress report endpoint
  .get(
    '/progress',
    validator('query', z.object({
      projectId: z.string(),
      timeRange: z.enum(['7d', '30d', '90d']).optional(),
      area: z.string().optional(),
      system: z.string().optional(),
    })),
    async (c) => {
      const { projectId, timeRange, area, system } = c.req.valid('query');
      const user = c.get('user');
      const organization = c.get('organization');

      // Call Supabase RPC for progress data
      const { data, error } = await c.get('supabase')
        .rpc('get_progress_summary', {
          p_project_id: projectId,
          p_organization_id: organization.id,
          p_time_range: timeRange || '30d',
          p_area_filter: area,
          p_system_filter: system,
        });

      if (error) {
        return c.json({ error: 'Failed to fetch progress data' }, 500);
      }

      return c.json({
        data,
        generatedAt: new Date().toISOString(),
        filters: { timeRange, area, system },
      });
    }
  )
  
  // Component report endpoint  
  .get(
    '/components',
    validator('query', z.object({
      projectId: z.string(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(10).max(1000).default(50),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
      filters: z.string().optional(), // JSON string
    })),
    async (c) => {
      const query = c.req.valid('query');
      const user = c.get('user');
      const organization = c.get('organization');
      
      const filters = query.filters ? JSON.parse(query.filters) : {};
      const offset = (query.page - 1) * query.limit;

      // Server-side filtering and pagination
      const { data, error, count } = await c.get('supabase')
        .rpc('get_components_paginated', {
          p_project_id: query.projectId,
          p_organization_id: organization.id,
          p_limit: query.limit,
          p_offset: offset,
          p_sort_by: query.sortBy,
          p_sort_order: query.sortOrder,
          p_filters: filters,
        });

      if (error) {
        return c.json({ error: 'Failed to fetch components' }, 500);
      }

      return c.json({
        data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: count,
          totalPages: Math.ceil(count / query.limit),
        },
        generatedAt: new Date().toISOString(),
      });
    }
  )
  
  // Export generation endpoint
  .post(
    '/export',
    validator('json', z.object({
      reportType: z.enum(['progress', 'components', 'test-packages', 'trends', 'audit']),
      format: z.enum(['excel', 'pdf', 'csv']),
      projectId: z.string(),
      filters: z.record(z.any()).optional(),
      options: z.object({
        includeCharts: z.boolean().default(true),
        rocCalculations: z.boolean().default(true),
        emailDelivery: z.boolean().default(false),
      }).default({}),
    })),
    async (c) => {
      const body = c.req.valid('json');
      const user = c.get('user');
      const organization = c.get('organization');

      // Queue export job for background processing
      const { data: job, error } = await c.get('supabase')
        .from('ReportGenerations')
        .insert({
          userId: user.id,
          organizationId: organization.id,
          projectId: body.projectId,
          reportType: body.reportType,
          format: body.format,
          filters: body.filters,
          options: body.options,
          status: 'queued',
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: 'Failed to queue export' }, 500);
      }

      // Trigger background job
      await c.get('supabase')
        .rpc('process_export_job', { job_id: job.id });

      return c.json({
        jobId: job.id,
        status: 'queued',
        estimatedTime: getEstimatedExportTime(body.reportType, body.format),
      });
    }
  );

export { reportsRouter };
```

### TanStack Query Hooks
```typescript
// apps/web/modules/pipetrak/reports/hooks/useProgressReport.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UseProgressReportOptions {
  projectId: string;
  filters?: {
    timeRange?: string;
    area?: string;
    system?: string;
  };
  refetchInterval?: number;
}

export function useProgressReport({
  projectId,
  filters = {},
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseProgressReportOptions) {
  return useQuery({
    queryKey: ['progress-report', projectId, filters],
    queryFn: async () => {
      const response = await apiClient.pipetrak.reports.progress.$get({
        query: {
          projectId,
          ...filters,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress report');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Export generation hook
export function useExportGeneration() {
  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await apiClient.pipetrak.reports.export.$post({
        json: options,
      });

      if (!response.ok) {
        throw new Error('Failed to generate export');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Export queued successfully');
      
      // Poll for completion if not email delivery
      if (!data.emailDelivery) {
        pollExportStatus(data.jobId);
      }
    },
    onError: (error) => {
      toast.error('Failed to generate export');
    },
  });
}
```

---

## Authentication Integration

### Role-Based Access Control
```typescript
// apps/web/modules/pipetrak/reports/components/ReportsGuard.tsx
import { useSession } from '@saas/auth/hooks/use-session';
import { useActiveOrganization } from '@saas/organizations/hooks/use-active-organization';
import { Alert, AlertDescription } from '@ui/components/alert';
import { Button } from '@ui/components/button';
import { ShieldX } from 'lucide-react';

interface ReportsGuardProps {
  children: React.ReactNode;
  requiredRole?: 'member' | 'admin' | 'owner';
  requiredPermissions?: string[];
}

export function ReportsGuard({ 
  children, 
  requiredRole = 'member',
  requiredPermissions = [] 
}: ReportsGuardProps) {
  const { session, user } = useSession();
  const { membership, organization } = useActiveOrganization();

  // Check authentication
  if (!session || !user) {
    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access reports.
        </AlertDescription>
      </Alert>
    );
  }

  // Check organization membership
  if (!membership || !organization) {
    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You don't have access to reports for this organization.
          <div className="mt-2">
            <Button size="sm" onClick={() => window.location.href = '/app'}>
              Return to Dashboard
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Check role requirements
  const roleHierarchy = { member: 1, admin: 2, owner: 3 };
  const userRoleLevel = roleHierarchy[membership.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 1;

  if (userRoleLevel < requiredRoleLevel) {
    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You need {requiredRole} permissions to access this report.
        </AlertDescription>
      </Alert>
    );
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      user.permissions?.includes(permission)
    );

    if (!hasAllPermissions) {
      return (
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            You don't have the required permissions for this report.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return <>{children}</>;
}
```

### Session-Aware Data Fetching
```typescript
// apps/web/modules/pipetrak/reports/lib/data-loaders.ts
import { getSession } from '@saas/auth/lib/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface DataLoaderOptions {
  projectId: string;
  organizationId: string;
  userId?: string;
  filters?: Record<string, any>;
}

export async function getProjectMetrics(options: DataLoaderOptions) {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const supabase = createServerSupabaseClient();

  // Use RLS-enabled query - automatically filters by organization
  const { data, error } = await supabase
    .rpc('get_project_metrics', {
      p_project_id: options.projectId,
      p_organization_id: options.organizationId,
    });

  if (error) {
    throw new Error('Failed to load project metrics');
  }

  return data;
}

export async function getProgressData(options: DataLoaderOptions) {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const supabase = createServerSupabaseClient();

  // Server-side data loading with user context
  const { data, error } = await supabase
    .rpc('get_progress_summary', {
      p_project_id: options.projectId,
      p_organization_id: options.organizationId,
      p_user_id: session.user.id,
      p_filters: options.filters || {},
    });

  if (error) {
    console.error('Progress data error:', error);
    throw new Error('Failed to load progress data');
  }

  return {
    ...data,
    metadata: {
      generatedAt: new Date().toISOString(),
      userId: session.user.id,
      organizationId: options.organizationId,
    },
  };
}
```

---

## shadcn/ui Component Usage

### Report Landing Page Implementation
```typescript
// apps/web/modules/pipetrak/reports/components/landing/ReportsLandingPage.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Badge } from '@ui/components/badge';
import { Skeleton } from '@ui/components/skeleton';
import { 
  TrendingUp, 
  FileText, 
  Package, 
  BarChart, 
  History,
  Download,
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ReportsLandingPageProps {
  projectId: string;
  organizationId: string;
  quickMetrics: any;
  userRole: string;
}

const reportTypes = [
  {
    id: 'progress',
    title: 'Progress Summary',
    description: 'ROC-weighted progress with area breakdown',
    icon: TrendingUp,
    color: 'primary',
    path: '/progress',
  },
  {
    id: 'components',
    title: 'Component Details',
    description: 'Detailed component list with filtering',
    icon: Package,
    color: 'secondary',
    path: '/components',
  },
  {
    id: 'test-packages',
    title: 'Test Package Readiness',
    description: 'Package status and blocking components',
    icon: FileText,
    color: 'success',
    path: '/test-packages',
  },
  {
    id: 'trends',
    title: 'Trend Analysis',
    description: 'Velocity forecasting and bottlenecks',
    icon: BarChart,
    color: 'warning',
    path: '/trends',
  },
  {
    id: 'audit',
    title: 'Audit Trail',
    description: 'Complete change history for compliance',
    icon: History,
    color: 'muted',
    path: '/audit',
  },
];

export function ReportsLandingPage({
  projectId,
  organizationId,
  quickMetrics,
  userRole,
}: ReportsLandingPageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleReportClick = (reportPath: string) => {
    router.push(`/app/pipetrak/${projectId}/reports${reportPath}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger data refresh
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive project reports with real-time data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              isRefreshing && "animate-spin"
            )} />
            Refresh Data
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      {quickMetrics ? (
        <QuickMetricsBar metrics={quickMetrics} />
      ) : (
        <QuickMetricsSkeleton />
      )}

      {/* Report Type Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          
          return (
            <Card
              key={report.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02]",
                "border-l-4",
                `border-l-${report.color}`
              )}
              onClick={() => handleReportClick(report.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    `bg-${report.color}/10`
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      `text-${report.color}`
                    )} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Click to generate
                  </div>
                  <Badge variant="secondary">
                    {userRole === 'admin' ? 'Full Access' : 'View Only'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <RecentReportsSection projectId={projectId} />
    </div>
  );
}

function QuickMetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Data Table with shadcn/ui
```typescript
// apps/web/modules/pipetrak/reports/components/components-report/VirtualizedDataTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/table';
import { Button } from '@ui/components/button';
import { Checkbox } from '@ui/components/checkbox';
import { Badge } from '@ui/components/badge';
import { Progress } from '@ui/components/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualizedDataTableProps {
  data: ComponentWithMilestones[];
  columns: TableColumn[];
  onRowSelect?: (componentId: string, selected: boolean) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  selectedIds?: Set<string>;
  sortConfig?: { column: string; direction: 'asc' | 'desc' };
}

export function VirtualizedDataTable({
  data,
  columns,
  onRowSelect,
  onSort,
  selectedIds = new Set(),
  sortConfig,
}: VirtualizedDataTableProps) {
  const handleSort = (column: string) => {
    const direction = 
      sortConfig?.column === column && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';
    onSort?.(column, direction);
  };

  const renderRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const component = data[index];
    const isSelected = selectedIds.has(component.id);

    return (
      <div style={style} className="border-b">
        <div className="flex items-center h-12 px-4">
          {onRowSelect && (
            <div className="w-12 flex justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => 
                  onRowSelect(component.id, checked as boolean)
                }
              />
            </div>
          )}
          
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center px-2",
                column.width ? `w-[${column.width}px]` : 'flex-1'
              )}
            >
              {renderCellContent(component, column)}
            </div>
          ))}
          
          <div className="w-12 flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Component</DropdownMenuItem>
                <DropdownMenuItem>View History</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-md">
      {/* Table Header */}
      <div className="border-b bg-muted/50">
        <div className="flex items-center h-12 px-4">
          {onRowSelect && (
            <div className="w-12 flex justify-center">
              <Checkbox
                checked={selectedIds.size === data.length && data.length > 0}
                indeterminate={selectedIds.size > 0 && selectedIds.size < data.length}
                onCheckedChange={(checked) => {
                  data.forEach((component) => {
                    onRowSelect(component.id, checked as boolean);
                  });
                }}
              />
            </div>
          )}
          
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center px-2 font-medium text-sm",
                column.width ? `w-[${column.width}px]` : 'flex-1'
              )}
            >
              {column.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              ) : (
                column.label
              )}
            </div>
          ))}
          
          <div className="w-12" /> {/* Actions column */}
        </div>
      </div>
      
      {/* Virtual List */}
      <List
        height={600}
        itemCount={data.length}
        itemSize={48}
        overscanCount={10}
      >
        {renderRow}
      </List>
    </div>
  );
}

function renderCellContent(component: ComponentWithMilestones, column: TableColumn) {
  switch (column.key) {
    case 'componentId':
      return (
        <div className="font-medium text-sm truncate">
          {component.componentId}
        </div>
      );
      
    case 'progress':
      return (
        <div className="space-y-1 min-w-[120px]">
          <Progress value={component.completionPercent} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {component.completionPercent}%
          </div>
        </div>
      );
      
    case 'status':
      const status = getComponentStatus(component);
      return (
        <Badge variant={status.variant}>
          {status.label}
        </Badge>
      );
      
    default:
      return (
        <div className="text-sm truncate">
          {component[column.key as keyof ComponentWithMilestones] || '-'}
        </div>
      );
  }
}

function getComponentStatus(component: ComponentWithMilestones) {
  if (component.completionPercent === 100) {
    return { label: 'Complete', variant: 'default' as const };
  }
  if (component.completionPercent > 75) {
    return { label: 'Near Complete', variant: 'secondary' as const };
  }
  if (component.completionPercent > 0) {
    return { label: 'In Progress', variant: 'outline' as const };
  }
  return { label: 'Not Started', variant: 'destructive' as const };
}
```

---

## next-intl Integration

### Message Keys Structure
```json
// apps/web/messages/en.json
{
  "reports": {
    "landing": {
      "title": "Reports",
      "description": "Generate comprehensive project reports with real-time data",
      "refreshData": "Refresh Data",
      "exportAll": "Export All",
      "clickToGenerate": "Click to generate"
    },
    "progress": {
      "title": "Progress Summary",
      "description": "ROC-weighted progress with area and system breakdown",
      "overallProgress": "Overall Progress",
      "rocWeighted": "ROC Weighted: {percent}%",
      "simpleCount": "Simple Count: {percent}%",
      "componentsComplete": "{completed} of {total} complete",
      "lastUpdated": "Last updated: {time}",
      "areaBreakdown": "Area & System Breakdown",
      "progressOverTime": "Progress Over Time",
      "exportOptions": {
        "title": "Export Options",
        "pdf": "Export PDF",
        "excel": "Export Excel",
        "email": "Email Report"
      }
    },
    "components": {
      "title": "Component Details",
      "description": "Detailed component list with advanced filtering",
      "filters": {
        "title": "Advanced Filters",
        "area": "Area",
        "system": "System", 
        "status": "Status",
        "dateRange": "Date Range",
        "clearAll": "Clear All Filters",
        "applyFilters": "Apply Filters"
      },
      "table": {
        "componentId": "Component ID",
        "description": "Description",
        "area": "Area",
        "system": "System",
        "progress": "Progress",
        "status": "Status",
        "lastUpdated": "Last Updated",
        "actions": "Actions"
      },
      "bulkActions": {
        "selectAll": "Select All",
        "deselectAll": "Deselect All",
        "exportSelected": "Export Selected",
        "updateMilestones": "Update Milestones",
        "selectedCount": "{count} component{count, plural, =1 {} other {s}} selected"
      }
    },
    "testPackages": {
      "title": "Test Package Readiness",
      "description": "Package status and blocking components",
      "statusSummary": {
        "ready": "Ready",
        "nearlyReady": "Nearly Ready", 
        "blocked": "Blocked",
        "notStarted": "Not Started"
      },
      "packageDetails": {
        "readyForTesting": "Ready for Testing",
        "componentsComplete": "{completed}/{total} components complete",
        "signedOff": "Signed off: {user}",
        "blockingComponents": "{count} components remaining",
        "critical": "Critical: {description}"
      }
    },
    "trends": {
      "title": "Trend Analysis",
      "description": "Velocity forecasting and bottleneck identification",
      "timeRange": {
        "7d": "7 Days",
        "30d": "30 Days",
        "90d": "90 Days",
        "custom": "Custom Range"
      },
      "velocity": {
        "title": "Completion Velocity",
        "componentsPerDay": "Components/Day",
        "actualVelocity": "Actual Velocity",
        "movingAverage": "7-Day Average",
        "forecast": "Forecast",
        "target": "Target"
      },
      "bottlenecks": {
        "title": "Bottleneck Analysis",
        "description": "Identify milestones and areas with highest stall rates",
        "heatmapLegend": {
          "low": "Low (0-5)",
          "medium": "Medium (6-15)",
          "high": "High (16+)"
        }
      }
    },
    "export": {
      "dialog": {
        "title": "Export Report",
        "description": "Configure your export options and generate the report file",
        "format": "Export Format",
        "options": "Export Options",
        "includeCharts": "Include charts and visualizations",
        "rocCalculations": "Show ROC calculation details",
        "emailDelivery": "Email when ready (large files)",
        "estimatedSize": "Estimated file size: {size}",
        "estimatedTime": "Generation time: {time}",
        "cancel": "Cancel",
        "generate": "Generate Export",
        "generating": "Generating..."
      },
      "formats": {
        "excel": {
          "name": "Excel",
          "description": "Spreadsheet with multiple sheets and formatting"
        },
        "pdf": {
          "name": "PDF",
          "description": "Print-ready document with charts"
        },
        "csv": {
          "name": "CSV", 
          "description": "Simple data format for analysis"
        }
      }
    },
    "accessibility": {
      "progressBar": "Progress: {percent} percent complete",
      "sortColumn": "Sort by {column}",
      "expandSection": "Expand {section} details",
      "selectComponent": "Select component {id}",
      "chartDescription": "Chart showing {description} over time"
    },
    "errors": {
      "loadFailed": "Failed to load report data",
      "exportFailed": "Failed to generate export",
      "permissionDenied": "You don't have permission to access this report",
      "connectionLost": "Connection lost. Some data may be outdated.",
      "retry": "Retry",
      "contactSupport": "Contact Support"
    }
  }
}
```

### Using Translations in Components
```typescript
// apps/web/modules/pipetrak/reports/components/progress/ProgressDashboard.tsx
import { useTranslations } from 'next-intl';

export function ProgressDashboard({ data }: ProgressDashboardProps) {
  const t = useTranslations('reports.progress');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      <ROCHeroBar
        rocProgress={data.rocProgress}
        simpleProgress={data.simpleProgress}
        componentCounts={data.componentCounts}
        lastUpdated={data.lastUpdated}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AreaSystemBreakdown
          title={t('areaBreakdown')}
          data={data.areaSystemMatrix}
        />
        
        <ProgressChart
          title={t('progressOverTime')}
          data={data.chartData}
        />
      </div>
    </div>
  );
}
```

### Server-Side Translation Loading
```typescript
// apps/web/app/(saas)/app/pipetrak/[projectId]/reports/progress/page.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ 
  params: { locale } 
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'reports.progress' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

---

## Performance Optimizations

### React Query Configuration
```typescript
// apps/web/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reports data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes when unused
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
      // Don't refetch on window focus for reports (data doesn't change frequently)
      refetchOnWindowFocus: false,
      // Refetch on reconnect to get latest data
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Prefetch key queries for faster navigation
export function prefetchReportQueries(projectId: string) {
  queryClient.prefetchQuery({
    queryKey: ['progress-report', projectId],
    queryFn: () => apiClient.pipetrak.reports.progress.$get({
      query: { projectId },
    }),
    staleTime: 5 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: ['component-report', projectId, { page: 1, limit: 50 }],
    queryFn: () => apiClient.pipetrak.reports.components.$get({
      query: { projectId, page: 1, limit: 50 },
    }),
  });
}
```

### Virtual Scrolling Implementation
```typescript
// apps/web/modules/pipetrak/reports/lib/virtual-scrolling.ts
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface UseVirtualTableOptions {
  data: any[];
  estimateSize: number;
  overscan?: number;
}

export function useVirtualTable({
  data,
  estimateSize,
  overscan = 10,
}: UseVirtualTableOptions) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  return {
    parentRef,
    virtualizer,
    items,
    totalSize: virtualizer.getTotalSize(),
  };
}

// Usage in component
export function VirtualizedComponentTable({ data }: { data: Component[] }) {
  const {
    parentRef,
    virtualizer,
    items,
    totalSize,
  } = useVirtualTable({
    data,
    estimateSize: 48, // Row height
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ComponentRow
              component={data[virtualRow.index]}
              index={virtualRow.index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Caching Strategy
```typescript
// apps/web/modules/pipetrak/reports/hooks/useReportCache.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

interface CacheConfig {
  staleTime: number;
  cacheTime: number;
  refetchInterval?: number;
}

const cacheConfigs: Record<string, CacheConfig> = {
  // Quick metrics refresh frequently for landing page
  'quick-metrics': {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  },
  // Progress data is more stable
  'progress-report': {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },
  // Component data changes frequently
  'component-report': {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  // Trend data is historical and stable
  'trend-analysis': {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
};

export function useReportCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const config = cacheConfigs[cacheKey.split('-')[0]] || cacheConfigs['progress-report'];
  
  return useQuery({
    queryKey: [cacheKey, ...dependencies],
    queryFn,
    ...config,
    // Enable background refetching for stale data
    refetchOnMount: 'always',
  });
}

// Cache invalidation utilities
export function useReportCacheInvalidation() {
  const queryClient = useQueryClient();
  
  return useMemo(() => ({
    // Invalidate all reports for a project
    invalidateProject: (projectId: string) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.includes(projectId);
        },
      });
    },
    
    // Invalidate specific report type
    invalidateReportType: (reportType: string, projectId: string) => {
      queryClient.invalidateQueries({
        queryKey: [reportType, projectId],
      });
    },
    
    // Force refresh all cached data
    refreshAll: () => {
      queryClient.invalidateQueries();
    },
  }), [queryClient]);
}
```

This comprehensive implementation guide provides the technical foundation for building PipeTrak's reporting module while maintaining full compliance with Supastarter's architectural patterns and conventions.
