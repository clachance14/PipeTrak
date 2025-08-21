# Paint & Insulation API Specification

## Overview

This document defines the complete API specification for Paint and Insulation tracking in PipeTrak. The API follows RESTful principles and integrates seamlessly with the existing Hono-based API architecture while adding scope-specific endpoints and enhanced authentication for subcontractor access.

**Key Principles:**
- **RESTful Design**: Consistent with existing PipeTrak API patterns
- **Scope-Based Security**: Role and scope-aware authorization
- **Performance-Optimized**: Bulk operations and efficient queries
- **Real-time Updates**: WebSocket integration for live progress updates
- **Mobile-Friendly**: Optimized for mobile app consumption

## Authentication and Authorization

### 1. Enhanced Authentication Middleware

**Scope-aware authentication extending existing better-auth integration:**

```typescript
// Enhanced middleware for Paint & Insulation API endpoints
export const paintInsulationAuthMiddleware = (
  requiredScope?: 'piping' | 'paint' | 'insulation' | 'all',
  requiredPermissions?: SubcontractorPermission[]
) => {
  return async (c: Context, next: Next) => {
    // Use existing better-auth session validation
    const session = await getSession(c);
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Get organization membership (existing Supastarter pattern)
    const { organization, membership } = await getActiveOrganization(c);
    if (!membership) {
      return c.json({ error: 'Organization membership required' }, 403);
    }

    // Get enhanced subcontractor role
    const subcontractorRole = await getUserSubcontractorRole(
      session.user.id, 
      organization.id
    );

    // Validate scope access
    if (requiredScope && !hasScope(subcontractorRole.scope, requiredScope)) {
      return c.json({
        error: 'Insufficient scope permissions',
        required: requiredScope,
        current: subcontractorRole.scope
      }, 403);
    }

    // Validate specific permissions
    if (requiredPermissions) {
      const hasPermissions = requiredPermissions.every(perm =>
        subcontractorRole.permissions.includes(perm)
      );

      if (!hasPermissions) {
        return c.json({
          error: 'Insufficient permissions',
          required: requiredPermissions,
          current: subcontractorRole.permissions
        }, 403);
      }
    }

    // Add context to request
    c.set('subcontractorRole', subcontractorRole);
    c.set('userScope', subcontractorRole.scope);
    c.set('organizationId', organization.id);

    await next();
  };
};
```

### 2. Permission Definitions

**Granular permissions for different operations:**

```typescript
enum SubcontractorPermission {
  // View permissions
  VIEW_ASSIGNED_COMPONENTS = 'view_assigned_components',
  VIEW_ALL_COMPONENTS = 'view_all_components',
  VIEW_PROGRESS_REPORTS = 'view_progress_reports',
  VIEW_OTHER_SCOPES = 'view_other_scopes',
  VIEW_PERFORMANCE_METRICS = 'view_performance_metrics',
  
  // Update permissions
  UPDATE_PAINT_PROGRESS = 'update_paint_progress',
  UPDATE_INSULATION_PROGRESS = 'update_insulation_progress',
  UPDATE_PIPING_PROGRESS = 'update_piping_progress',
  BULK_UPDATE_PROGRESS = 'bulk_update_progress',
  
  // Assignment permissions
  ASSIGN_WORK = 'assign_work',
  REASSIGN_WORK = 'reassign_work',
  MANAGE_CREW_ASSIGNMENTS = 'manage_crew_assignments',
  
  // Export and reporting
  EXPORT_DATA = 'export_data',
  GENERATE_REPORTS = 'generate_reports',
  
  // Administrative
  MANAGE_SUBCONTRACTOR_USERS = 'manage_subcontractor_users',
  VIEW_AUDIT_LOGS = 'view_audit_logs'
}
```

## Core API Endpoints

### 1. Component Management

**Enhanced component endpoints with scope filtering:**

```typescript
// GET /api/pipetrak/components - Enhanced with scope filtering
export const getComponents = new Hono()
  .get(
    '/',
    paintInsulationAuthMiddleware('all', ['VIEW_ASSIGNED_COMPONENTS']),
    validator('query', z.object({
      projectId: z.string(),
      scope: z.enum(['all', 'piping', 'paint', 'insulation']).optional(),
      area: z.string().optional(),
      system: z.string().optional(),
      status: z.enum(['not_started', 'in_progress', 'complete']).optional(),
      assignedTo: z.string().optional(),
      limit: z.coerce.number().min(1).max(1000).default(100),
      offset: z.coerce.number().min(0).default(0),
      includePaintProgress: z.boolean().default(false),
      includeInsulationProgress: z.boolean().default(false)
    })),
    async (c) => {
      const query = c.req.valid('query');
      const userScope = c.get('userScope');
      const organizationId = c.get('organizationId');

      // Build scope-aware query
      const scopeFilter = buildScopeFilter(userScope, query.scope);
      
      const components = await prisma.component.findMany({
        where: {
          projectId: query.projectId,
          project: {
            organizationId
          },
          ...scopeFilter,
          ...(query.area && { area: query.area }),
          ...(query.system && { system: query.system }),
          ...(query.status && { status: query.status })
        },
        include: {
          paintProgress: query.includePaintProgress || userScope === 'paint',
          insulationProgress: query.includeInsulationProgress || userScope === 'insulation',
          milestones: userScope === 'piping' || userScope === 'all'
        },
        orderBy: [
          { area: 'asc' },
          { system: 'asc' },
          { componentId: 'asc' }
        ],
        take: query.limit,
        skip: query.offset
      });

      return c.json({
        components,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: await getComponentsCount(query.projectId, scopeFilter)
        },
        scope: userScope
      });
    }
  );

// GET /api/pipetrak/components/:id - Enhanced component details
export const getComponentDetails = new Hono()
  .get(
    '/:id',
    paintInsulationAuthMiddleware('all', ['VIEW_ASSIGNED_COMPONENTS']),
    async (c) => {
      const componentId = c.req.param('id');
      const userScope = c.get('userScope');
      const organizationId = c.get('organizationId');

      const component = await prisma.component.findFirst({
        where: {
          id: componentId,
          project: {
            organizationId
          }
        },
        include: {
          project: true,
          drawing: true,
          milestones: {
            orderBy: { milestoneOrder: 'asc' }
          },
          paintProgress: {
            include: {
              assignedSubcontractor: true
            }
          },
          insulationProgress: {
            include: {
              assignedSubcontractor: true
            }
          },
          auditLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!component) {
        return c.json({ error: 'Component not found' }, 404);
      }

      // Filter data based on user scope
      const filteredComponent = filterComponentByScope(component, userScope);

      return c.json({
        component: filteredComponent,
        permissions: calculateComponentPermissions(component, userScope)
      });
    }
  );
```

### 2. Paint Progress Management

**Paint-specific progress tracking endpoints:**

```typescript
export const paintProgressRouter = new Hono()
  // GET /api/pipetrak/paint/progress
  .get(
    '/progress',
    paintInsulationAuthMiddleware('paint', ['VIEW_ASSIGNED_COMPONENTS']),
    validator('query', z.object({
      projectId: z.string(),
      status: z.enum(['not_started', 'primer_complete', 'complete']).optional(),
      subcontractor: z.string().optional(),
      assignedTo: z.string().optional(),
      dueDate: z.string().optional(),
      limit: z.coerce.number().min(1).max(1000).default(100),
      offset: z.coerce.number().min(0).default(0)
    })),
    async (c) => {
      const query = c.req.valid('query');
      const organizationId = c.get('organizationId');

      const paintProgress = await prisma.paintProgress.findMany({
        where: {
          component: {
            projectId: query.projectId,
            project: { organizationId },
            // Only components with valid paint specs
            paintSpec: {
              not: null,
              not: '',
              not: 'NONE'
            }
          },
          ...(query.status && { 
            completionPercent: getCompletionPercentForStatus(query.status) 
          }),
          ...(query.subcontractor && { subcontractor: query.subcontractor }),
          ...(query.assignedTo && { assignedTo: query.assignedTo })
        },
        include: {
          component: {
            select: {
              id: true,
              displayId: true,
              componentId: true,
              description: true,
              area: true,
              system: true,
              paintSpec: true,
              drawing: {
                select: { number: true, title: true }
              }
            }
          }
        },
        orderBy: [
          { component: { area: 'asc' } },
          { component: { system: 'asc' } },
          { component: { componentId: 'asc' } }
        ],
        take: query.limit,
        skip: query.offset
      });

      return c.json({
        paintProgress,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: await getPaintProgressCount(query.projectId, organizationId)
        }
      });
    }
  )

  // PUT /api/pipetrak/paint/progress/:componentId
  .put(
    '/progress/:componentId',
    paintInsulationAuthMiddleware('paint', ['UPDATE_PAINT_PROGRESS']),
    validator('json', z.object({
      primerComplete: z.boolean().optional(),
      finishCoatComplete: z.boolean().optional(),
      notes: z.string().optional(),
      photos: z.array(z.string()).optional(), // URLs to uploaded photos
      assignedTo: z.string().optional(),
      estimatedCompletion: z.string().datetime().optional()
    })),
    async (c) => {
      const componentId = c.req.param('componentId');
      const updateData = c.req.valid('json');
      const userId = c.get('session').user.id;

      // Verify component exists and user has access
      const component = await verifyComponentAccess(componentId, 'paint', userId);
      if (!component) {
        return c.json({ error: 'Component not found or access denied' }, 404);
      }

      // Update paint progress
      const updatedProgress = await prisma.paintProgress.update({
        where: { componentId },
        data: {
          ...updateData,
          // Completion percentage is calculated automatically by trigger
          ...(updateData.primerComplete !== undefined && {
            primerCompletedAt: updateData.primerComplete ? new Date() : null,
            primerCompletedBy: updateData.primerComplete ? userId : null
          }),
          ...(updateData.finishCoatComplete !== undefined && {
            finishCoatCompletedAt: updateData.finishCoatComplete ? new Date() : null,
            finishCoatCompletedBy: updateData.finishCoatComplete ? userId : null
          })
        },
        include: {
          component: {
            select: {
              id: true,
              displayId: true,
              projectId: true
            }
          }
        }
      });

      // Create audit log entry
      await createProgressAuditLog({
        userId,
        componentId,
        scope: 'paint',
        changes: updateData,
        previousState: component.paintProgress
      });

      // Broadcast real-time update
      await broadcastProgressUpdate(component.projectId, {
        type: 'paint_progress_update',
        componentId,
        progress: updatedProgress
      });

      // Check for milestone triggers (handoffs to other scopes)
      await checkMilestoneHandoffs(componentId);

      return c.json({
        success: true,
        progress: updatedProgress,
        message: 'Paint progress updated successfully'
      });
    }
  );
```

### 3. Insulation Progress Management

**Insulation-specific progress tracking endpoints:**

```typescript
export const insulationProgressRouter = new Hono()
  // GET /api/pipetrak/insulation/progress
  .get(
    '/progress',
    paintInsulationAuthMiddleware('insulation', ['VIEW_ASSIGNED_COMPONENTS']),
    validator('query', z.object({
      projectId: z.string(),
      status: z.enum(['not_started', 'insulate_complete', 'complete']).optional(),
      subcontractor: z.string().optional(),
      assignedTo: z.string().optional(),
      insulationSpec: z.string().optional(),
      limit: z.coerce.number().min(1).max(1000).default(100),
      offset: z.coerce.number().min(0).default(0)
    })),
    async (c) => {
      const query = c.req.valid('query');
      const organizationId = c.get('organizationId');

      const insulationProgress = await prisma.insulationProgress.findMany({
        where: {
          component: {
            projectId: query.projectId,
            project: { organizationId },
            // Only components with valid insulation specs
            insulationSpec: {
              not: null,
              not: '',
              not: 'NONE'
            }
          },
          ...(query.status && { 
            completionPercent: getCompletionPercentForInsulationStatus(query.status) 
          }),
          ...(query.subcontractor && { subcontractor: query.subcontractor }),
          ...(query.assignedTo && { assignedTo: query.assignedTo }),
          ...(query.insulationSpec && { insulationSpec: query.insulationSpec })
        },
        include: {
          component: {
            select: {
              id: true,
              displayId: true,
              componentId: true,
              description: true,
              area: true,
              system: true,
              insulationSpec: true,
              drawing: {
                select: { number: true, title: true }
              }
            }
          }
        },
        orderBy: [
          { component: { area: 'asc' } },
          { component: { system: 'asc' } },
          { component: { componentId: 'asc' } }
        ],
        take: query.limit,
        skip: query.offset
      });

      return c.json({
        insulationProgress,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: await getInsulationProgressCount(query.projectId, organizationId)
        }
      });
    }
  )

  // PUT /api/pipetrak/insulation/progress/:componentId
  .put(
    '/progress/:componentId',
    paintInsulationAuthMiddleware('insulation', ['UPDATE_INSULATION_PROGRESS']),
    validator('json', z.object({
      insulateComplete: z.boolean().optional(),
      metalOutComplete: z.boolean().optional(),
      notes: z.string().optional(),
      photos: z.array(z.string()).optional(),
      assignedTo: z.string().optional(),
      estimatedCompletion: z.string().datetime().optional()
    })),
    async (c) => {
      const componentId = c.req.param('componentId');
      const updateData = c.req.valid('json');
      const userId = c.get('session').user.id;

      // Verify component exists and user has access
      const component = await verifyComponentAccess(componentId, 'insulation', userId);
      if (!component) {
        return c.json({ error: 'Component not found or access denied' }, 404);
      }

      // Update insulation progress
      const updatedProgress = await prisma.insulationProgress.update({
        where: { componentId },
        data: {
          ...updateData,
          // Completion percentage is calculated automatically by trigger
          ...(updateData.insulateComplete !== undefined && {
            insulateCompletedAt: updateData.insulateComplete ? new Date() : null,
            insulateCompletedBy: updateData.insulateComplete ? userId : null
          }),
          ...(updateData.metalOutComplete !== undefined && {
            metalOutCompletedAt: updateData.metalOutComplete ? new Date() : null,
            metalOutCompletedBy: updateData.metalOutComplete ? userId : null
          })
        },
        include: {
          component: {
            select: {
              id: true,
              displayId: true,
              projectId: true
            }
          }
        }
      });

      // Create audit log entry
      await createProgressAuditLog({
        userId,
        componentId,
        scope: 'insulation',
        changes: updateData,
        previousState: component.insulationProgress
      });

      // Broadcast real-time update
      await broadcastProgressUpdate(component.projectId, {
        type: 'insulation_progress_update',
        componentId,
        progress: updatedProgress
      });

      // Check for milestone triggers
      await checkMilestoneHandoffs(componentId);

      return c.json({
        success: true,
        progress: updatedProgress,
        message: 'Insulation progress updated successfully'
      });
    }
  );
```

### 4. Bulk Operations

**Efficient bulk update endpoints for field crews:**

```typescript
export const bulkOperationsRouter = new Hono()
  // POST /api/pipetrak/bulk/paint/update
  .post(
    '/paint/update',
    paintInsulationAuthMiddleware('paint', ['BULK_UPDATE_PROGRESS']),
    validator('json', z.object({
      componentIds: z.array(z.string()).min(1).max(1000),
      updates: z.object({
        primerComplete: z.boolean().optional(),
        finishCoatComplete: z.boolean().optional(),
        assignedTo: z.string().optional(),
        subcontractor: z.string().optional(),
        notes: z.string().optional()
      }),
      mode: z.enum(['update_all', 'update_if_exists']).default('update_all')
    })),
    async (c) => {
      const { componentIds, updates, mode } = c.req.valid('json');
      const userId = c.get('session').user.id;
      const organizationId = c.get('organizationId');

      // Validate user has access to all components
      const accessibleComponents = await validateBulkAccess(
        componentIds, 
        'paint', 
        userId, 
        organizationId
      );

      if (accessibleComponents.length !== componentIds.length) {
        return c.json({
          error: 'Access denied to some components',
          accessible: accessibleComponents.length,
          requested: componentIds.length
        }, 403);
      }

      // Perform bulk update
      const bulkUpdateResults = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const componentId of accessibleComponents) {
          try {
            // Get current state for audit log
            const currentProgress = await tx.paintProgress.findUnique({
              where: { componentId }
            });

            // Update paint progress
            const updatedProgress = await tx.paintProgress.update({
              where: { componentId },
              data: {
                ...updates,
                ...(updates.primerComplete !== undefined && {
                  primerCompletedAt: updates.primerComplete ? new Date() : null,
                  primerCompletedBy: updates.primerComplete ? userId : null
                }),
                ...(updates.finishCoatComplete !== undefined && {
                  finishCoatCompletedAt: updates.finishCoatComplete ? new Date() : null,
                  finishCoatCompletedBy: updates.finishCoatComplete ? userId : null
                })
              }
            });

            // Create audit log entry
            await tx.auditLog.create({
              data: {
                userId,
                action: 'bulk_paint_progress_update',
                entityType: 'paint_progress',
                entityId: componentId,
                changes: {
                  updates,
                  previousState: currentProgress
                },
                timestamp: new Date()
              }
            });

            results.push({
              componentId,
              success: true,
              progress: updatedProgress
            });

          } catch (error) {
            results.push({
              componentId,
              success: false,
              error: error.message
            });
          }
        }

        return results;
      });

      // Count successes and failures
      const successful = bulkUpdateResults.filter(r => r.success);
      const failed = bulkUpdateResults.filter(r => !r.success);

      // Broadcast bulk update notification
      if (successful.length > 0) {
        const projectId = successful[0]?.progress?.component?.projectId;
        if (projectId) {
          await broadcastProgressUpdate(projectId, {
            type: 'bulk_paint_progress_update',
            updatedComponents: successful.length,
            userId,
            timestamp: new Date()
          });
        }
      }

      return c.json({
        success: failed.length === 0,
        results: {
          total: componentIds.length,
          successful: successful.length,
          failed: failed.length,
          details: bulkUpdateResults
        },
        message: `Bulk update completed: ${successful.length} successful, ${failed.length} failed`
      });
    }
  )

  // POST /api/pipetrak/bulk/insulation/update
  .post(
    '/insulation/update',
    paintInsulationAuthMiddleware('insulation', ['BULK_UPDATE_PROGRESS']),
    validator('json', z.object({
      componentIds: z.array(z.string()).min(1).max(1000),
      updates: z.object({
        insulateComplete: z.boolean().optional(),
        metalOutComplete: z.boolean().optional(),
        assignedTo: z.string().optional(),
        subcontractor: z.string().optional(),
        notes: z.string().optional()
      }),
      mode: z.enum(['update_all', 'update_if_exists']).default('update_all')
    })),
    async (c) => {
      // Similar implementation to paint bulk update
      // but targeting insulationProgress table
      // Implementation follows same pattern as paint bulk update
    }
  );
```

### 5. Progress Summary and Analytics

**Multi-scope progress analytics endpoints:**

```typescript
export const progressAnalyticsRouter = new Hono()
  // GET /api/pipetrak/analytics/progress-summary
  .get(
    '/progress-summary',
    paintInsulationAuthMiddleware('all', ['VIEW_PROGRESS_REPORTS']),
    validator('query', z.object({
      projectId: z.string(),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
      }).optional(),
      breakdown: z.enum(['area', 'system', 'drawing', 'subcontractor']).optional(),
      includeHistory: z.boolean().default(false)
    })),
    async (c) => {
      const query = c.req.valid('query');
      const organizationId = c.get('organizationId');
      const userScope = c.get('userScope');

      // Calculate current progress by scope
      const progressSummary = await calculateMultiScopeProgress(
        query.projectId, 
        organizationId
      );

      // Get breakdown data if requested
      let breakdown = null;
      if (query.breakdown) {
        breakdown = await getProgressBreakdown(
          query.projectId,
          organizationId,
          query.breakdown,
          userScope
        );
      }

      // Get historical data if requested
      let history = null;
      if (query.includeHistory) {
        history = await getProgressHistory(
          query.projectId,
          organizationId,
          query.dateRange,
          userScope
        );
      }

      return c.json({
        projectId: query.projectId,
        summary: progressSummary,
        breakdown,
        history,
        calculatedAt: new Date(),
        userScope
      });
    }
  )

  // GET /api/pipetrak/analytics/turnover-readiness
  .get(
    '/turnover-readiness',
    paintInsulationAuthMiddleware('all', ['VIEW_PROGRESS_REPORTS']),
    validator('query', z.object({
      projectId: z.string(),
      area: z.string().optional(),
      system: z.string().optional(),
      readyOnly: z.boolean().default(false)
    })),
    async (c) => {
      const query = c.req.valid('query');
      const organizationId = c.get('organizationId');

      // Get turnover readiness data
      const turnoverData = await calculateTurnoverReadiness(
        query.projectId,
        organizationId,
        {
          area: query.area,
          system: query.system,
          readyOnly: query.readyOnly
        }
      );

      return c.json({
        turnoverReadiness: turnoverData,
        calculatedAt: new Date()
      });
    }
  )

  // GET /api/pipetrak/analytics/subcontractor-performance
  .get(
    '/subcontractor-performance',
    paintInsulationAuthMiddleware('all', ['VIEW_PERFORMANCE_METRICS']),
    validator('query', z.object({
      projectId: z.string(),
      subcontractor: z.string().optional(),
      scope: z.enum(['paint', 'insulation']).optional(),
      timeframe: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
    })),
    async (c) => {
      const query = c.req.valid('query');
      const organizationId = c.get('organizationId');
      const userScope = c.get('userScope');

      // Verify user can view performance metrics
      if (userScope !== 'all' && query.subcontractor) {
        // Subcontractors can only view their own performance
        const userSubcontractor = await getUserSubcontractorCompany(
          c.get('session').user.id,
          organizationId
        );
        
        if (userSubcontractor?.id !== query.subcontractor) {
          return c.json({ error: 'Access denied to subcontractor data' }, 403);
        }
      }

      const performance = await calculateSubcontractorPerformance(
        query.projectId,
        organizationId,
        {
          subcontractor: query.subcontractor,
          scope: query.scope || userScope,
          timeframe: query.timeframe
        }
      );

      return c.json({
        performance,
        calculatedAt: new Date()
      });
    }
  );
```

## Real-time Updates

### 1. WebSocket Integration

**Real-time progress updates using Supabase Realtime:**

```typescript
export class ProgressRealtimeManager {
  
  static async broadcastProgressUpdate(
    projectId: string,
    update: ProgressUpdateEvent
  ): Promise<void> {
    
    // Broadcast to project-wide channel
    await supabase.channel(`project_${projectId}`)
      .send({
        type: 'broadcast',
        event: 'progress_update',
        payload: {
          ...update,
          timestamp: new Date().toISOString(),
          projectId
        }
      });

    // Broadcast to scope-specific channels
    if (update.scope) {
      await supabase.channel(`project_${projectId}_${update.scope}`)
        .send({
          type: 'broadcast',
          event: `${update.scope}_progress_update`,
          payload: update
        });
    }
  }

  static async broadcastBulkUpdate(
    projectId: string,
    bulkUpdate: BulkUpdateEvent
  ): Promise<void> {
    
    await supabase.channel(`project_${projectId}`)
      .send({
        type: 'broadcast',
        event: 'bulk_progress_update',
        payload: {
          ...bulkUpdate,
          timestamp: new Date().toISOString(),
          projectId
        }
      });
  }

  static async broadcastMilestoneHandoff(
    projectId: string,
    handoff: HandoffEvent
  ): Promise<void> {
    
    // Notify relevant scope channels
    const targetScopes = this.getTargetScopes(handoff.milestone);
    
    for (const scope of targetScopes) {
      await supabase.channel(`project_${projectId}_${scope}`)
        .send({
          type: 'broadcast',
          event: 'milestone_handoff',
          payload: {
            ...handoff,
            targetScope: scope,
            timestamp: new Date().toISOString()
          }
        });
    }
  }
}

interface ProgressUpdateEvent {
  type: 'paint_progress_update' | 'insulation_progress_update' | 'piping_progress_update';
  componentId: string;
  scope: 'paint' | 'insulation' | 'piping';
  progress: {
    percentage: number;
    milestones: MilestoneUpdate[];
  };
  userId: string;
  timestamp: string;
}

interface BulkUpdateEvent {
  type: 'bulk_progress_update';
  scope: 'paint' | 'insulation' | 'piping';
  componentsUpdated: number;
  userId: string;
  updates: Record<string, any>;
  timestamp: string;
}

interface HandoffEvent {
  type: 'milestone_handoff';
  componentId: string;
  milestone: 'piping_complete' | 'paint_ready' | 'insulation_ready' | 'turnover_ready';
  fromScope: string;
  toScope: string;
  timestamp: string;
}
```

### 2. WebSocket Channel Subscriptions

**Client-side subscription management:**

```typescript
export class ProgressSubscriptionManager {
  
  static subscribeToProjectProgress(
    projectId: string,
    userScope: string,
    callbacks: ProgressCallbacks
  ): RealtimeChannel {
    
    const channel = supabase.channel(`project_${projectId}`)
      .on(
        'broadcast',
        { event: 'progress_update' },
        (payload) => {
          if (this.shouldReceiveUpdate(payload, userScope)) {
            callbacks.onProgressUpdate?.(payload);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'bulk_progress_update' },
        (payload) => {
          if (this.shouldReceiveUpdate(payload, userScope)) {
            callbacks.onBulkUpdate?.(payload);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'milestone_handoff' },
        (payload) => {
          if (payload.targetScope === userScope || userScope === 'all') {
            callbacks.onMilestoneHandoff?.(payload);
          }
        }
      )
      .subscribe();

    // Also subscribe to scope-specific channel if not 'all'
    if (userScope !== 'all') {
      const scopeChannel = supabase.channel(`project_${projectId}_${userScope}`)
        .on(
          'broadcast',
          { event: `${userScope}_progress_update` },
          callbacks.onScopeSpecificUpdate
        )
        .subscribe();
    }

    return channel;
  }

  private static shouldReceiveUpdate(
    payload: any,
    userScope: string
  ): boolean {
    // Always receive if user has 'all' scope
    if (userScope === 'all') return true;
    
    // Receive if update is for user's scope
    return payload.scope === userScope;
  }
}

interface ProgressCallbacks {
  onProgressUpdate?: (update: ProgressUpdateEvent) => void;
  onBulkUpdate?: (update: BulkUpdateEvent) => void;
  onMilestoneHandoff?: (handoff: HandoffEvent) => void;
  onScopeSpecificUpdate?: (update: any) => void;
}
```

## Mobile API Optimizations

### 1. Mobile-Specific Endpoints

**Endpoints optimized for mobile consumption:**

```typescript
export const mobileApiRouter = new Hono()
  // GET /api/pipetrak/mobile/dashboard
  .get(
    '/dashboard',
    paintInsulationAuthMiddleware('all'),
    validator('query', z.object({
      projectId: z.string()
    })),
    async (c) => {
      const { projectId } = c.req.valid('query');
      const userScope = c.get('userScope');
      const userId = c.get('session').user.id;

      // Get mobile-optimized dashboard data
      const dashboardData = await getMobileDashboardData(
        projectId,
        userScope,
        userId
      );

      return c.json({
        ...dashboardData,
        // Mobile-specific optimizations
        reducedPayload: true,
        cacheKey: `mobile_dashboard_${projectId}_${userScope}_${Date.now()}`,
        ttl: 300 // 5 minute cache TTL
      });
    }
  )

  // GET /api/pipetrak/mobile/work-queue
  .get(
    '/work-queue',
    paintInsulationAuthMiddleware('all'),
    validator('query', z.object({
      projectId: z.string(),
      limit: z.coerce.number().min(1).max(50).default(20), // Smaller mobile limits
      priority: z.enum(['high', 'urgent']).optional()
    })),
    async (c) => {
      const query = c.req.valid('query');
      const userScope = c.get('userScope');
      const userId = c.get('session').user.id;

      const workQueue = await getMobileWorkQueue(
        query.projectId,
        userScope,
        userId,
        {
          limit: query.limit,
          priority: query.priority
        }
      );

      return c.json({
        workQueue,
        optimizedForMobile: true,
        imagePreloadUrls: workQueue
          .filter(item => item.photos?.length > 0)
          .map(item => item.photos[0]) // Only preload first image
      });
    }
  )

  // POST /api/pipetrak/mobile/quick-update
  .post(
    '/quick-update',
    paintInsulationAuthMiddleware('all', ['UPDATE_PAINT_PROGRESS', 'UPDATE_INSULATION_PROGRESS']),
    validator('json', z.object({
      componentId: z.string(),
      scope: z.enum(['paint', 'insulation']),
      action: z.enum(['complete_milestone', 'start_work', 'complete_work']),
      milestone: z.string().optional(),
      notes: z.string().max(500).optional(), // Shorter notes for mobile
      location: z.object({
        latitude: z.number(),
        longitude: z.number()
      }).optional(),
      photo: z.string().optional() // Base64 encoded image for quick capture
    })),
    async (c) => {
      const updateData = c.req.valid('json');
      const userId = c.get('session').user.id;

      // Process quick mobile update
      const result = await processMobileQuickUpdate(
        updateData,
        userId
      );

      // Broadcast update immediately for real-time sync
      await broadcastProgressUpdate(result.projectId, {
        type: `${updateData.scope}_progress_update`,
        componentId: updateData.componentId,
        scope: updateData.scope,
        progress: result.progress,
        userId,
        timestamp: new Date().toISOString()
      });

      return c.json({
        success: true,
        result,
        message: 'Quick update completed',
        nextSuggestion: result.nextComponent // Suggest next component for efficiency
      });
    }
  );
```

### 2. Offline Support

**Offline queue management for mobile apps:**

```typescript
// POST /api/pipetrak/mobile/sync
export const syncOfflineUpdates = new Hono()
  .post(
    '/sync',
    paintInsulationAuthMiddleware('all'),
    validator('json', z.object({
      updates: z.array(z.object({
        id: z.string(), // Client-side update ID
        componentId: z.string(),
        scope: z.enum(['paint', 'insulation', 'piping']),
        data: z.record(z.any()),
        timestamp: z.string().datetime(),
        deviceId: z.string().optional()
      })).max(100), // Limit batch size
      clientVersion: z.string().optional(),
      lastSyncTimestamp: z.string().datetime().optional()
    })),
    async (c) => {
      const { updates, clientVersion, lastSyncTimestamp } = c.req.valid('json');
      const userId = c.get('session').user.id;
      const organizationId = c.get('organizationId');

      const syncResults = [];
      const conflicts = [];

      // Process each queued update
      for (const update of updates) {
        try {
          // Check for conflicts with server data
          const serverState = await getComponentLatestState(
            update.componentId,
            update.scope
          );

          if (hasConflict(update, serverState, lastSyncTimestamp)) {
            conflicts.push({
              updateId: update.id,
              conflict: 'data_newer_on_server',
              serverData: serverState,
              clientData: update.data
            });
            continue;
          }

          // Apply the update
          const result = await applyOfflineUpdate(update, userId);
          
          syncResults.push({
            updateId: update.id,
            success: true,
            result,
            appliedAt: new Date()
          });

        } catch (error) {
          syncResults.push({
            updateId: update.id,
            success: false,
            error: error.message
          });
        }
      }

      // Get any server-side updates since last sync
      const serverUpdates = lastSyncTimestamp
        ? await getServerUpdatesSince(organizationId, lastSyncTimestamp)
        : [];

      return c.json({
        syncResults,
        conflicts,
        serverUpdates,
        syncTimestamp: new Date().toISOString(),
        nextSyncRecommended: conflicts.length > 0 ? 'immediately' : '5_minutes'
      });
    }
  );
```

## Error Handling and Validation

### 1. Standardized Error Responses

**Consistent error handling across all endpoints:**

```typescript
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof APIError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }, err.statusCode);
  }

  // Log unexpected errors
  console.error('Unexpected API error:', err);

  return c.json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }, 500);
};

// Common error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Permission errors
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_COMPONENT_STATE: 'INVALID_COMPONENT_STATE',
  
  // Business logic errors
  COMPONENT_NOT_FOUND: 'COMPONENT_NOT_FOUND',
  SPECIFICATION_REQUIRED: 'SPECIFICATION_REQUIRED',
  PREREQUISITE_NOT_MET: 'PREREQUISITE_NOT_MET',
  
  // Sync and conflict errors
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  STALE_DATA: 'STALE_DATA',
  VERSION_MISMATCH: 'VERSION_MISMATCH'
};
```

### 2. Request Validation Middleware

**Comprehensive input validation:**

```typescript
export const requestValidationMiddleware = (
  schema: z.ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return async (c: Context, next: Next) => {
    try {
      let data;
      
      switch (target) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.queries();
          break;
        case 'params':
          data = c.req.param();
          break;
      }

      const validatedData = schema.parse(data);
      c.set(`validated_${target}`, validatedData);
      
      await next();
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new APIError(
          400,
          ERROR_CODES.INVALID_INPUT,
          'Validation failed',
          {
            target,
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        );
      }
      
      throw error;
    }
  };
};
```

## Performance and Caching

### 1. Response Caching Strategy

**Multi-level caching for optimal performance:**

```typescript
export class APICacheManager {
  
  static async getCached<T>(
    key: string,
    generator: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
  ): Promise<T> {
    
    // Try Redis cache first (if available)
    if (this.redis) {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // Generate fresh data
    const data = await generator();
    
    // Cache the result
    if (this.redis) {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    }

    return data;
  }

  static generateCacheKey(
    endpoint: string,
    params: Record<string, any>,
    userScope: string
  ): string {
    const paramsHash = this.hashParams(params);
    return `api:${endpoint}:${userScope}:${paramsHash}`;
  }

  static async invalidateCache(pattern: string): Promise<void> {
    if (this.redis) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // Invalidate cache when data changes
  static async invalidateProgressCache(
    projectId: string,
    scope?: string
  ): Promise<void> {
    const patterns = [
      `api:progress-summary:*:*${projectId}*`,
      `api:components:*:*${projectId}*`,
      `api:analytics:*:*${projectId}*`
    ];

    if (scope) {
      patterns.push(`api:${scope}:*:*${projectId}*`);
    }

    for (const pattern of patterns) {
      await this.invalidateCache(pattern);
    }
  }
}
```

### 2. Database Query Optimization

**Optimized queries with proper indexing:**

```typescript
export class OptimizedQueries {
  
  // Optimized component query with scope filtering
  static async getComponentsOptimized(
    projectId: string,
    scope: string,
    filters: ComponentFilters,
    pagination: PaginationOptions
  ) {
    
    // Use the materialized view for better performance
    const query = prisma.$queryRaw`
      SELECT 
        c.*,
        pp."completionPercent" as paint_progress,
        ip."completionPercent" as insulation_progress,
        pp.subcontractor as paint_subcontractor,
        ip.subcontractor as insulation_subcontractor
      FROM component_scope_summary c
      LEFT JOIN "PaintProgress" pp ON c."componentId" = pp."componentId"
      LEFT JOIN "InsulationProgress" ip ON c."componentId" = ip."componentId"
      WHERE c."projectId" = ${projectId}
        AND ${this.buildScopeCondition(scope)}
        AND ${this.buildFilterConditions(filters)}
      ORDER BY c.area, c.system, c."businessId"
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;
    
    return query;
  }

  // Optimized progress calculation
  static async calculateProgressOptimized(
    projectId: string,
    organizationId: string
  ) {
    
    // Single query to get all progress data
    const progressData = await prisma.$queryRaw`
      WITH progress_summary AS (
        SELECT 
          'piping' as scope,
          COUNT(*) as total_components,
          COUNT(*) FILTER (WHERE "completionPercent" = 100) as completed_components,
          AVG("completionPercent") as avg_progress
        FROM "Component" 
        WHERE "projectId" = ${projectId}
        
        UNION ALL
        
        SELECT 
          'paint' as scope,
          COUNT(*) as total_components,
          COUNT(*) FILTER (WHERE pp."completionPercent" = 100) as completed_components,
          AVG(pp."completionPercent") as avg_progress
        FROM "Component" c
        JOIN "PaintProgress" pp ON c.id = pp."componentId"
        WHERE c."projectId" = ${projectId}
          AND c."paintSpec" IS NOT NULL 
          AND c."paintSpec" != '' 
          AND c."paintSpec" != 'NONE'
        
        UNION ALL
        
        SELECT 
          'insulation' as scope,
          COUNT(*) as total_components,
          COUNT(*) FILTER (WHERE ip."completionPercent" = 100) as completed_components,
          AVG(ip."completionPercent") as avg_progress
        FROM "Component" c
        JOIN "InsulationProgress" ip ON c.id = ip."componentId"
        WHERE c."projectId" = ${projectId}
          AND c."insulationSpec" IS NOT NULL 
          AND c."insulationSpec" != '' 
          AND c."insulationSpec" != 'NONE'
      )
      SELECT * FROM progress_summary;
    `;
    
    return this.formatProgressSummary(progressData);
  }
}
```

---

*Document Version: 1.0*  
*Author: API Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Focus: RESTful design with mobile optimizations and real-time updates*