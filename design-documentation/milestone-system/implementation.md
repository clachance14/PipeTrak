# Implementation Guide - Milestone Update System

## Developer Handoff Overview

This guide provides exact implementation specifications for PipeTrak's Milestone Update System, including component APIs, integration patterns, and performance requirements. All specifications follow Supastarter conventions with Next.js App Router, shadcn/ui, and TanStack Query.

---

## Project Structure

### File Organization
```
apps/web/modules/pipetrak/components/milestones/
├── core/
│   ├── MilestoneUpdateEngine.tsx          # Central state management
│   ├── MilestoneWorkflowRenderer.tsx      # Workflow type routing
│   ├── OptimisticUpdateManager.ts         # Client-side state
│   └── BulkOperationManager.ts            # Bulk update coordination
├── discrete/
│   ├── DiscreteCheckboxCard.tsx           # Checkbox milestone interface
│   ├── DiscreteBulkPanel.tsx             # Bulk discrete updates
│   └── DiscreteProgressBar.tsx           # Visual progress display
├── percentage/
│   ├── PercentageSliderCard.tsx          # Slider + input interface
│   ├── PercentageBulkPanel.tsx           # Bulk percentage updates
│   └── PercentageVisualization.tsx       # Progress charts
├── quantity/
│   ├── QuantityInputCard.tsx             # Stepper input interface
│   ├── QuantityBulkPanel.tsx             # Bulk quantity updates
│   └── QuantityCalculator.tsx            # Unit conversion logic
├── bulk/
│   ├── BulkUpdateModal.tsx               # Main bulk update interface
│   ├── BulkPreviewTable.tsx             # Preview changes table
│   ├── BulkProgressTracker.tsx           # Real-time progress
│   └── BulkUndoManager.tsx               # Rollback functionality
├── mobile/
│   ├── MobileMilestoneSheet.tsx          # Bottom sheet container
│   ├── TouchMilestoneCard.tsx            # Large touch targets
│   ├── SwipeActions.tsx                  # Swipe gesture handling
│   └── OfflineQueue.tsx                  # Offline operation queue
├── integration/
│   ├── TableMilestoneColumn.tsx          # TanStack Table integration
│   ├── QuickActionBar.tsx                # Bulk action floating bar
│   └── LiveProgressIndicator.tsx         # Real-time progress sync
└── index.ts                              # Public API exports
```

---

## Core Component APIs

### MilestoneUpdateEngine
```typescript
interface MilestoneUpdateEngineProps {
  component: ComponentWithMilestones;
  milestones: ComponentMilestone[];
  onUpdate: (update: MilestoneUpdate) => Promise<void>;
  onBulkUpdate?: (updates: MilestoneUpdate[]) => Promise<BulkUpdateResult>;
  mode?: 'inline' | 'modal' | 'mobile';
  disabled?: boolean;
  optimisticUpdates?: boolean;
}

interface MilestoneUpdate {
  componentId: string;
  milestoneId: string;
  workflowType: WorkflowType;
  update: {
    isCompleted?: boolean;
    percentageComplete?: number;
    quantityComplete?: number;
    completedBy?: string;
    completedAt?: Date;
  };
  metadata?: {
    reason?: string;
    batchId?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export const MilestoneUpdateEngine: React.FC<MilestoneUpdateEngineProps> = ({
  component,
  milestones,
  onUpdate,
  onBulkUpdate,
  mode = 'inline',
  disabled = false,
  optimisticUpdates = true
}) => {
  const [optimisticState, setOptimisticState] = useState<Map<string, any>>(new Map());
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  
  const handleMilestoneUpdate = useCallback(async (milestoneId: string, update: any) => {
    if (disabled) return;
    
    const milestoneUpdate: MilestoneUpdate = {
      componentId: component.id,
      milestoneId,
      workflowType: component.workflowType,
      update,
      metadata: {
        batchId: generateBatchId(),
        priority: 'normal'
      }
    };
    
    if (optimisticUpdates) {
      // Apply optimistic update immediately
      setOptimisticState(prev => new Map(prev.set(milestoneId, update)));
      setPendingUpdates(prev => new Set(prev.add(milestoneId)));
    }
    
    try {
      await onUpdate(milestoneUpdate);
      
      // Confirm success
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(milestoneId);
        return next;
      });
      setErrors(prev => {
        const next = new Map(prev);
        next.delete(milestoneId);
        return next;
      });
    } catch (error) {
      // Rollback optimistic update
      if (optimisticUpdates) {
        setOptimisticState(prev => {
          const next = new Map(prev);
          next.delete(milestoneId);
          return next;
        });
      }
      
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(milestoneId);
        return next;
      });
      setErrors(prev => new Map(prev.set(milestoneId, error as Error)));
    }
  }, [component.id, component.workflowType, onUpdate, disabled, optimisticUpdates]);
  
  const getMilestoneState = useCallback((milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return null;
    
    const optimisticUpdate = optimisticState.get(milestoneId);
    if (optimisticUpdate) {
      return { ...milestone, ...optimisticUpdate };
    }
    
    return milestone;
  }, [milestones, optimisticState]);
  
  const getMilestoneStatus = useCallback((milestoneId: string): 'idle' | 'pending' | 'error' => {
    if (pendingUpdates.has(milestoneId)) return 'pending';
    if (errors.has(milestoneId)) return 'error';
    return 'idle';
  }, [pendingUpdates, errors]);
  
  return (
    <div className="milestone-update-engine">
      {milestones.map(milestone => (
        <MilestoneWorkflowRenderer
          key={milestone.id}
          milestone={getMilestoneState(milestone.id)}
          status={getMilestoneStatus(milestone.id)}
          error={errors.get(milestone.id)}
          onUpdate={(update) => handleMilestoneUpdate(milestone.id, update)}
          mode={mode}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
```

### MilestoneWorkflowRenderer
```typescript
interface MilestoneWorkflowRendererProps {
  milestone: ComponentMilestone | null;
  status: 'idle' | 'pending' | 'error';
  error?: Error;
  onUpdate: (update: any) => Promise<void>;
  mode: 'inline' | 'modal' | 'mobile';
  disabled: boolean;
}

export const MilestoneWorkflowRenderer: React.FC<MilestoneWorkflowRendererProps> = ({
  milestone,
  status,
  error,
  onUpdate,
  mode,
  disabled
}) => {
  if (!milestone) return null;
  
  const commonProps = {
    milestone,
    status,
    error,
    onUpdate,
    disabled,
    className: cn(
      'milestone-card',
      `milestone-card--${mode}`,
      {
        'milestone-card--pending': status === 'pending',
        'milestone-card--error': status === 'error',
        'milestone-card--disabled': disabled
      }
    )
  };
  
  // Route to appropriate workflow component based on type
  switch (milestone.component?.workflowType) {
    case WorkflowType.MILESTONE_DISCRETE:
      return mode === 'mobile' 
        ? <MobileDiscreteCard {...commonProps} />
        : <DiscreteCheckboxCard {...commonProps} />;
        
    case WorkflowType.MILESTONE_PERCENTAGE:
      return mode === 'mobile'
        ? <MobilePercentageCard {...commonProps} />
        : <PercentageSliderCard {...commonProps} />;
        
    case WorkflowType.MILESTONE_QUANTITY:
      return mode === 'mobile'
        ? <MobileQuantityCard {...commonProps} />
        : <QuantityInputCard {...commonProps} />;
        
    default:
      return (
        <Card className="p-4">
          <div className="text-muted-foreground">
            Unknown workflow type: {milestone.component?.workflowType}
          </div>
        </Card>
      );
  }
};
```

---

## TanStack Table Integration

### Table Column Definition
```typescript
import { ColumnDef } from '@tanstack/react-table';
import { TableMilestoneColumn } from '../milestones/integration/TableMilestoneColumn';

export const createMilestoneColumn = (): ColumnDef<ComponentWithMilestones> => ({
  id: 'milestones',
  header: ({ column }) => (
    <div className="flex items-center gap-2">
      <span>Progress</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    </div>
  ),
  accessorFn: (row) => row.completionPercent,
  cell: ({ row, table }) => (
    <TableMilestoneColumn
      component={row.original}
      milestones={row.original.milestones || []}
      onUpdate={async (update) => {
        // Integrate with your API layer
        await updateComponentMilestone(update);
        // Invalidate table data
        table.options.meta?.invalidateQueries?.();
      }}
    />
  ),
  size: 200,
  minSize: 150,
  maxSize: 300,
  enableSorting: true,
  sortingFn: (rowA, rowB) => {
    return rowA.original.completionPercent - rowB.original.completionPercent;
  }
});

// Usage in ComponentTable
const columns = [
  // ... other columns
  createMilestoneColumn(),
  // ... more columns
];
```

### TableMilestoneColumn Implementation
```typescript
interface TableMilestoneColumnProps {
  component: ComponentWithMilestones;
  milestones: ComponentMilestone[];
  onUpdate: (update: MilestoneUpdate) => Promise<void>;
}

export const TableMilestoneColumn: React.FC<TableMilestoneColumnProps> = ({
  component,
  milestones,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  
  const completionPercent = component.completionPercent;
  const completedCount = milestones.filter(m => 
    m.isCompleted || 
    (m.percentageComplete && m.percentageComplete === 100) ||
    (m.quantityComplete && m.quantityTotal && m.quantityComplete >= m.quantityTotal)
  ).length;
  
  if (isEditing) {
    return (
      <div className="min-w-[180px] p-2">
        <MilestoneUpdateEngine
          component={component}
          milestones={milestones}
          onUpdate={onUpdate}
          mode="inline"
        />
        <div className="flex gap-2 mt-2">
          <Button 
            size="sm" 
            onClick={() => setIsEditing(false)}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded group"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex-1">
        <Progress value={completionPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{completedCount}/{milestones.length} milestones</span>
          <span>{Math.round(completionPercent)}%</span>
        </div>
      </div>
      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
```

---

## API Integration Patterns

### TanStack Query Mutations
```typescript
// Mutation hooks for milestone updates
export const useUpdateMilestoneMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (update: MilestoneUpdate) => {
      const response = await apiClient.milestones.$post({
        json: {
          componentId: update.componentId,
          milestoneId: update.milestoneId,
          ...update.update
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update milestone: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    onMutate: async (update) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['components'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['components']);
      
      // Optimistically update cache
      queryClient.setQueryData(['components'], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          data: old.data.map((component: ComponentWithMilestones) => {
            if (component.id === update.componentId) {
              return {
                ...component,
                milestones: component.milestones?.map(milestone => {
                  if (milestone.id === update.milestoneId) {
                    return { ...milestone, ...update.update };
                  }
                  return milestone;
                }) || []
              };
            }
            return component;
          })
        };
      });
      
      return { previousData };
    },
    
    onError: (error, update, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['components'], context.previousData);
      }
      
      toast.error(`Failed to update milestone: ${error.message}`);
    },
    
    onSuccess: (data, update) => {
      toast.success('Milestone updated successfully');
    },
    
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['components'] });
    }
  });
};

export const useBulkUpdateMilestonesMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: MilestoneUpdate[]) => {
      const response = await apiClient.milestones.bulk.$post({
        json: { updates }
      });
      
      if (!response.ok) {
        throw new Error(`Bulk update failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    
    onSuccess: (data) => {
      const { successful, failed } = data;
      
      if (failed.length === 0) {
        toast.success(`Successfully updated ${successful.length} milestones`);
      } else {
        toast.warning(
          `Updated ${successful.length} milestones, ${failed.length} failed`
        );
      }
      
      // Invalidate component data
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
    
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    }
  });
};
```

### Hono RPC API Routes
```typescript
// packages/api/src/routes/pipetrak/milestones.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { validator } from 'hono/validator';
import { authMiddleware } from '../../middleware/auth';
import { verifyOrganizationMembership } from '@saas/organizations/lib/server';

const milestoneUpdateSchema = z.object({
  componentId: z.string(),
  milestoneId: z.string(),
  isCompleted: z.boolean().optional(),
  percentageComplete: z.number().min(0).max(100).optional(),
  quantityComplete: z.number().min(0).optional()
});

const bulkUpdateSchema = z.object({
  updates: z.array(milestoneUpdateSchema),
  options: z.object({
    atomic: z.boolean().default(false),
    validateOnly: z.boolean().default(false)
  }).optional()
});

export const milestonesRouter = new Hono()
  .post(
    '/',
    authMiddleware,
    validator('json', milestoneUpdateSchema),
    async (c) => {
      const user = c.get('user');
      const update = c.req.valid('json');
      
      // Verify user can update this component
      const component = await db.component.findUnique({
        where: { id: update.componentId },
        include: { project: true }
      });
      
      if (!component) {
        return c.json({ error: 'Component not found' }, 404);
      }
      
      await verifyOrganizationMembership(component.project.organizationId, user.id);
      
      // Update milestone
      const milestone = await db.componentMilestone.update({
        where: { id: update.milestoneId },
        data: {
          ...update,
          completedAt: update.isCompleted ? new Date() : null,
          completedBy: update.isCompleted ? user.id : null,
          updatedAt: new Date()
        }
      });
      
      // Recalculate component completion
      await recalculateComponentCompletion(component.id);
      
      // Audit log
      await createAuditLog({
        projectId: component.projectId,
        userId: user.id,
        entityType: 'ComponentMilestone',
        entityId: milestone.id,
        action: 'UPDATE',
        oldValue: null, // Could store previous value
        newValue: update
      });
      
      return c.json(milestone);
    }
  )
  .post(
    '/bulk',
    authMiddleware,
    validator('json', bulkUpdateSchema),
    async (c) => {
      const user = c.get('user');
      const { updates, options = {} } = c.req.valid('json');
      
      if (options.validateOnly) {
        // Validation-only mode for preview
        const validationResults = await validateBulkUpdates(updates, user.id);
        return c.json(validationResults);
      }
      
      const results = {
        successful: [] as any[],
        failed: [] as { update: any; error: string }[]
      };
      
      // Process updates in batches to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        if (options.atomic) {
          // All-or-nothing transaction
          try {
            await db.$transaction(async (tx) => {
              for (const update of batch) {
                await processSingleUpdate(tx, update, user.id);
                results.successful.push(update);
              }
            });
          } catch (error) {
            // If atomic and any fails, mark entire batch as failed
            batch.forEach(update => {
              results.failed.push({
                update,
                error: error instanceof Error ? error.message : 'Transaction failed'
              });
            });
          }
        } else {
          // Best-effort processing
          for (const update of batch) {
            try {
              await processSingleUpdate(db, update, user.id);
              results.successful.push(update);
            } catch (error) {
              results.failed.push({
                update,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }
      
      return c.json(results);
    }
  );

async function processSingleUpdate(db: any, update: any, userId: string) {
  // Verify permissions
  const component = await db.component.findUnique({
    where: { id: update.componentId },
    include: { project: true }
  });
  
  if (!component) {
    throw new Error(`Component ${update.componentId} not found`);
  }
  
  // Update milestone
  const milestone = await db.componentMilestone.update({
    where: { id: update.milestoneId },
    data: {
      ...update,
      completedAt: update.isCompleted ? new Date() : null,
      completedBy: update.isCompleted ? userId : null,
      updatedAt: new Date()
    }
  });
  
  // Recalculate completion percentage
  await recalculateComponentCompletion(component.id);
  
  return milestone;
}

async function recalculateComponentCompletion(componentId: string) {
  const milestones = await db.componentMilestone.findMany({
    where: { componentId }
  });
  
  if (milestones.length === 0) return;
  
  let totalProgress = 0;
  for (const milestone of milestones) {
    if (milestone.isCompleted) {
      totalProgress += 100;
    } else if (milestone.percentageComplete) {
      totalProgress += milestone.percentageComplete;
    } else if (milestone.quantityComplete && milestone.quantityTotal) {
      totalProgress += (milestone.quantityComplete / milestone.quantityTotal) * 100;
    }
  }
  
  const averageProgress = totalProgress / milestones.length;
  
  await db.component.update({
    where: { id: componentId },
    data: { 
      completionPercent: Math.round(averageProgress * 100) / 100,
      status: averageProgress === 100 ? 'COMPLETED' : 
              averageProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    }
  });
}
```

---

## Performance Optimizations

### Virtual Scrolling for Large Datasets
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedMilestoneList = ({ milestones, onUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: milestones.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 120, // Estimated milestone card height
    overscan: 5
  });
  
  return (
    <div 
      ref={containerRef}
      className="h-[400px] overflow-auto"
    >
      <div 
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const milestone = milestones[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <MilestoneCard
                milestone={milestone}
                onUpdate={onUpdate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### Debounced Updates
```typescript
const useDebouncedMilestoneUpdate = (onUpdate: (update: MilestoneUpdate) => Promise<void>) => {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, MilestoneUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedUpdate = useCallback((update: MilestoneUpdate) => {
    // Store update in pending map
    setPendingUpdates(prev => new Map(prev.set(update.milestoneId, update)));
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdates.values());
      setPendingUpdates(new Map());
      
      // Batch process all pending updates
      try {
        await Promise.all(updates.map(onUpdate));
      } catch (error) {
        console.error('Batch update failed:', error);
        // Could implement retry logic here
      }
    }, 1000);
  }, [onUpdate, pendingUpdates]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedUpdate;
};
```

---

## Error Handling & Recovery

### Error Boundary Component
```typescript
interface MilestoneErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MilestoneErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  MilestoneErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): MilestoneErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    console.error('Milestone component error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-destructive">
                Milestone Update Error
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Error details
                  </summary>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try Again
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      );
    }
    
    return this.props.children;
  }
}

// Usage wrapper
export const MilestoneUpdateEngineWithErrorBoundary: React.FC<MilestoneUpdateEngineProps> = (props) => (
  <MilestoneErrorBoundary>
    <MilestoneUpdateEngine {...props} />
  </MilestoneErrorBoundary>
);
```

### Retry Logic
```typescript
const useRetryableOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  maxRetries = 3,
  delay = 1000
) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const executeWithRetry = useCallback(async (...args: T): Promise<R> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
        
        const result = await operation(...args);
        
        // Success - reset retry state
        setRetryCount(0);
        setIsRetrying(false);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        setRetryCount(attempt + 1);
        
        // If not the last attempt, continue retrying
        if (attempt < maxRetries) {
          console.warn(`Operation failed, retrying (${attempt + 1}/${maxRetries}):`, error);
          continue;
        }
      }
    }
    
    // All retries exhausted
    setIsRetrying(false);
    throw lastError!;
  }, [operation, maxRetries, delay]);
  
  return { executeWithRetry, isRetrying, retryCount };
};
```

---

## Testing Specifications

### Component Testing Example
```typescript
// __tests__/MilestoneUpdateEngine.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilestoneUpdateEngine } from '../MilestoneUpdateEngine';
import { createMockComponent, createMockMilestones } from '../__fixtures__/milestones';

describe('MilestoneUpdateEngine', () => {
  it('applies optimistic updates immediately', async () => {
    const mockComponent = createMockComponent({
      workflowType: 'MILESTONE_DISCRETE'
    });
    const mockMilestones = createMockMilestones([
      { milestoneName: 'Install Pipe', isCompleted: false }
    ]);
    const onUpdate = jest.fn().mockResolvedValue({});
    
    render(
      <MilestoneUpdateEngine
        component={mockComponent}
        milestones={mockMilestones}
        onUpdate={onUpdate}
        optimisticUpdates={true}
      />
    );
    
    const checkbox = screen.getByLabelText(/install pipe/i);
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    
    // Should be checked immediately (optimistic)
    expect(checkbox).toBeChecked();
    
    // API should be called
    expect(onUpdate).toHaveBeenCalledWith({
      componentId: mockComponent.id,
      milestoneId: mockMilestones[0].id,
      workflowType: 'MILESTONE_DISCRETE',
      update: { isCompleted: true }
    });
  });
  
  it('rolls back optimistic updates on API failure', async () => {
    const mockComponent = createMockComponent();
    const mockMilestones = createMockMilestones([
      { milestoneName: 'Install Pipe', isCompleted: false }
    ]);
    const onUpdate = jest.fn().mockRejectedValue(new Error('Network error'));
    
    render(
      <MilestoneUpdateEngine
        component={mockComponent}
        milestones={mockMilestones}
        onUpdate={onUpdate}
        optimisticUpdates={true}
      />
    );
    
    const checkbox = screen.getByLabelText(/install pipe/i);
    fireEvent.click(checkbox);
    
    // Should be checked initially
    expect(checkbox).toBeChecked();
    
    // Wait for API failure
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
    
    // Error state should be displayed
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
  
  it('handles bulk updates correctly', async () => {
    const mockComponent = createMockComponent();
    const mockMilestones = createMockMilestones([
      { milestoneName: 'Milestone 1', isCompleted: false },
      { milestoneName: 'Milestone 2', isCompleted: false }
    ]);
    const onBulkUpdate = jest.fn().mockResolvedValue({
      successful: 2,
      failed: 0
    });
    
    render(
      <MilestoneUpdateEngine
        component={mockComponent}
        milestones={mockMilestones}
        onBulkUpdate={onBulkUpdate}
      />
    );
    
    // Test bulk update functionality
    // ... implementation
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/milestone-table.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentTable } from '../../ComponentTable';
import { createMockComponents } from '../__fixtures__/components';

describe('Milestone Table Integration', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
  });
  
  it('renders milestone columns with progress indicators', async () => {
    const mockComponents = createMockComponents([
      {
        componentId: 'PIPE-001',
        completionPercent: 75,
        milestones: [
          { milestoneName: 'Install', isCompleted: true },
          { milestoneName: 'Test', isCompleted: false },
          { milestoneName: 'Commission', isCompleted: false }
        ]
      }
    ]);
    
    render(
      <QueryClientProvider client={queryClient}>
        <ComponentTable components={mockComponents} />
      </QueryClientProvider>
    );
    
    // Progress bar should show 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    // Should show milestone count
    expect(screen.getByText('1/3 milestones')).toBeInTheDocument();
  });
});
```

This implementation guide provides developers with all the necessary specifications to build a robust, field-ready milestone update system that integrates seamlessly with the existing PipeTrak architecture.