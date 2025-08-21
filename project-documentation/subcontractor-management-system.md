# Subcontractor Management System Specification

## Overview

This document defines a comprehensive subcontractor management system for Paint and Insulation activities in PipeTrak. The system provides role-based access, workflow management, and performance tracking specifically designed for specialty subcontractors who operate independently from the main construction crews.

**Key Principles:**
- **Scope Independence**: Subcontractors only see and manage their specific scope of work
- **Mobile-First Design**: Optimized interfaces for field crews using tablets and phones
- **Bulk Operations**: Efficient tools for updating multiple components simultaneously
- **Performance Tracking**: Detailed metrics and reporting for subcontractor performance
- **Integration**: Seamless handoff between piping completion and specialty work

## User Roles and Permissions

### 1. Role Definitions

**Enhanced role system building on existing Supastarter roles:**

```typescript
interface SubcontractorRole {
  baseRole: 'member' | 'admin' | 'owner'; // Existing Supastarter role
  scope: 'piping' | 'paint' | 'insulation' | 'all';
  permissions: SubcontractorPermission[];
  company?: string; // Subcontractor company name
  restrictions?: AccessRestriction[];
}

enum SubcontractorPermission {
  // Viewing permissions
  VIEW_ASSIGNED_COMPONENTS = 'view_assigned_components',
  VIEW_PROGRESS_REPORTS = 'view_progress_reports',
  VIEW_OTHER_SCOPES = 'view_other_scopes',
  
  // Update permissions
  UPDATE_PROGRESS = 'update_progress',
  BULK_UPDATE_PROGRESS = 'bulk_update_progress',
  ASSIGN_CREW_MEMBERS = 'assign_crew_members',
  
  // Administrative permissions
  MANAGE_SUBCONTRACTOR_USERS = 'manage_subcontractor_users',
  EXPORT_DATA = 'export_data',
  VIEW_PERFORMANCE_METRICS = 'view_performance_metrics'
}
```

### 2. Role-Based Access Matrix

| Role | Scope | View Components | Update Progress | Bulk Updates | View Other Scopes | Admin Functions |
|------|-------|-----------------|-----------------|--------------|-------------------|-----------------|
| **Paint Foreman** | paint | ✅ Paint only | ✅ Paint only | ✅ Paint only | 🔍 Read-only | ❌ |
| **Paint Supervisor** | paint | ✅ Paint only | ✅ Paint only | ✅ Paint only | 🔍 Read-only | ✅ Paint team |
| **Insulation Foreman** | insulation | ✅ Insulation only | ✅ Insulation only | ✅ Insulation only | 🔍 Read-only | ❌ |
| **Insulation Supervisor** | insulation | ✅ Insulation only | ✅ Insulation only | ✅ Insulation only | 🔍 Read-only | ✅ Insulation team |
| **Project Manager** | all | ✅ All scopes | ✅ All scopes | ✅ All scopes | ✅ Full access | ✅ All teams |
| **Construction Foreman** | piping | ✅ All components | ✅ Piping only | ✅ Piping only | ✅ Full access | ❌ |

### 3. Company-Based Segregation

**Subcontractor company isolation:**

```typescript
interface SubcontractorCompany {
  id: string;
  name: string;
  scope: 'paint' | 'insulation';
  organizationId: string;
  
  // Contact information
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Contract details
  contractNumber?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  
  // Performance tracking
  performanceMetrics: {
    averageCompletionTime: number;
    qualityScore: number;
    safetyRecord: string;
  };
  
  // Access settings
  allowedProjects: string[]; // Project IDs this company can access
  ipRestrictions?: string[]; // Optional IP whitelist
  mobileOnly: boolean; // Restrict to mobile interfaces only
}
```

## Access Control Implementation

### 1. Enhanced Middleware

**Scope-aware authentication middleware:**

```typescript
// Enhanced middleware for subcontractor access control
export const subcontractorAuthMiddleware = (requiredScope?: 'piping' | 'paint' | 'insulation') => {
  return async (c: Context, next: Next) => {
    // Get session using existing auth
    const session = await getSession(c);
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Get organization membership
    const { membership } = await getActiveOrganization(c);
    if (!membership) {
      return c.json({ error: 'Organization membership required' }, 403);
    }
    
    // Get subcontractor role and scope
    const subcontractorRole = await getSubcontractorRole(session.user.id, membership.organizationId);
    
    // Check scope permission
    if (requiredScope && !hasScope(subcontractorRole, requiredScope)) {
      return c.json({ 
        error: 'Insufficient scope permissions',
        requiredScope,
        userScope: subcontractorRole.scope
      }, 403);
    }
    
    // Add scope context to request
    c.set('subcontractorRole', subcontractorRole);
    c.set('userScope', subcontractorRole.scope);
    
    await next();
  };
};

// Scope permission checker
function hasScope(role: SubcontractorRole, requiredScope: string): boolean {
  return role.scope === 'all' || role.scope === requiredScope;
}
```

### 2. Data Filtering by Scope

**Database-level filtering for subcontractor queries:**

```typescript
export class ScopedDataAccess {
  
  static async getComponentsForUser(
    userId: string,
    organizationId: string,
    projectId: string,
    filters?: ComponentFilters
  ): Promise<ComponentWithProgress[]> {
    
    const userRole = await getSubcontractorRole(userId, organizationId);
    
    // Build query based on user scope
    const whereClause = {
      projectId,
      ...this.buildScopeFilter(userRole),
      ...filters
    };
    
    return await prisma.component.findMany({
      where: whereClause,
      include: {
        paintProgress: userRole.scope === 'paint' || userRole.scope === 'all',
        insulationProgress: userRole.scope === 'insulation' || userRole.scope === 'all',
        milestones: userRole.scope === 'piping' || userRole.scope === 'all'
      },
      orderBy: [
        { area: 'asc' },
        { system: 'asc' },
        { componentId: 'asc' }
      ]
    });
  }
  
  private static buildScopeFilter(role: SubcontractorRole): any {
    switch (role.scope) {
      case 'paint':
        return {
          paintSpec: {
            not: null,
            not: '',
            not: 'NONE'
          }
        };
        
      case 'insulation':
        return {
          insulationSpec: {
            not: null,
            not: '',
            not: 'NONE'
          }
        };
        
      case 'piping':
        return {}; // Piping crew can see all components
        
      case 'all':
        return {}; // Project managers see everything
        
      default:
        return { id: 'impossible' }; // Block access for unknown scopes
    }
  }
}
```

## Mobile-Optimized Interfaces

### 1. Mobile Dashboard Design

**Simplified dashboard for subcontractor field crews:**

```typescript
interface SubcontractorMobileDashboard {
  // Summary cards
  assignedComponents: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  
  // Today's work
  todaysAssignments: ComponentAssignment[];
  
  // Quick actions
  quickActions: {
    bulkUpdate: boolean;
    scanBarcode: boolean;
    offlineMode: boolean;
  };
  
  // Performance summary
  performance: {
    completionRate: number;
    averageTime: number;
    qualityScore: number;
  };
}

interface ComponentAssignment {
  componentId: string;
  displayId: string;
  description: string;
  location: {
    area: string;
    system: string;
    drawing?: string;
  };
  
  // Scope-specific progress
  progress: {
    currentStage: 'not_started' | 'primer' | 'finish' | 'insulate' | 'metal_out' | 'complete';
    nextAction: string;
    estimatedTime: number; // minutes
  };
  
  // Assignment details
  assignedTo: string;
  assignedDate: Date;
  dueDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}
```

### 2. Mobile Progress Update Interface

**Touch-optimized progress entry:**

```typescript
interface MobileProgressUpdate {
  // Component identification
  component: {
    id: string;
    displayId: string;
    description: string;
    location: string;
  };
  
  // Progress selection (large touch targets)
  progressOptions: {
    paint?: {
      primer: { complete: boolean; timestamp?: Date };
      finishCoat: { complete: boolean; timestamp?: Date };
    };
    insulation?: {
      insulate: { complete: boolean; timestamp?: Date };
      metalOut: { complete: boolean; timestamp?: Date };
    };
  };
  
  // Quick entry features
  features: {
    barcodeScanner: boolean;
    voiceNotes: boolean;
    photoCapture: boolean;
    gpsLocation: boolean;
    offlineCapable: boolean;
  };
}
```

### 3. Bulk Update Mobile Interface

**Efficient bulk operations for field crews:**

```typescript
interface MobileBulkUpdate {
  // Selection modes
  selectionMode: 'area' | 'system' | 'drawing' | 'manual';
  
  // Quick filters
  quickFilters: {
    area: string[];
    system: string[];
    status: ('not_started' | 'in_progress' | 'complete')[];
  };
  
  // Bulk actions
  bulkActions: {
    markPrimerComplete: boolean;
    markFinishCoatComplete: boolean;
    markInsulateComplete: boolean;
    markMetalOutComplete: boolean;
    assignToCrew: string[];
    setPriority: 'low' | 'normal' | 'high' | 'urgent';
  };
  
  // Confirmation and validation
  confirmation: {
    componentsSelected: number;
    estimatedTime: number; // minutes
    requiresPhotos: boolean;
    requiresSignoff: boolean;
  };
}
```

## Workflow Management

### 1. Work Assignment System

**Intelligent work assignment for subcontractors:**

```typescript
export class SubcontractorWorkAssignment {
  
  async assignWork(
    projectId: string,
    scope: 'paint' | 'insulation',
    assignment: {
      subcontractor: string;
      crew?: string;
      components: string[];
      dueDate?: Date;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      prerequisites?: string[]; // Other milestones that must be complete
    }
  ): Promise<AssignmentResult> {
    
    // Validate prerequisites
    const prerequisiteCheck = await this.validatePrerequisites(
      assignment.components,
      assignment.prerequisites || []
    );
    
    if (!prerequisiteCheck.allMet) {
      return {
        success: false,
        error: 'Prerequisites not met',
        details: prerequisiteCheck.failedComponents
      };
    }
    
    // Create assignments
    const assignments = await Promise.all(
      assignment.components.map(componentId =>
        this.createComponentAssignment(componentId, assignment)
      )
    );
    
    // Notify assigned crew
    await this.notifyAssignment(assignment.subcontractor, assignments);
    
    return {
      success: true,
      assignmentsCreated: assignments.length,
      estimatedCompletionTime: this.calculateEstimatedTime(assignments)
    };
  }
  
  private async validatePrerequisites(
    componentIds: string[],
    prerequisites: string[]
  ): Promise<PrerequisiteValidation> {
    
    const failedComponents = [];
    
    for (const componentId of componentIds) {
      const component = await prisma.component.findUnique({
        where: { id: componentId },
        include: { milestones: true }
      });
      
      for (const prerequisite of prerequisites) {
        const milestone = component?.milestones.find(m => m.milestoneName === prerequisite);
        if (!milestone || !milestone.isCompleted) {
          failedComponents.push({
            componentId,
            missingPrerequisite: prerequisite
          });
        }
      }
    }
    
    return {
      allMet: failedComponents.length === 0,
      failedComponents
    };
  }
}
```

### 2. Progress Handoff Management

**Automated handoff between scopes:**

```typescript
export class ProgressHandoffManager {
  
  async checkAndTriggerHandoffs(componentId: string): Promise<HandoffResult[]> {
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      include: {
        milestones: true,
        paintProgress: true,
        insulationProgress: true
      }
    });
    
    if (!component) return [];
    
    const handoffs: HandoffResult[] = [];
    
    // Check for piping-to-paint handoff
    if (this.isPipingReadyForPaint(component) && component.paintSpec) {
      const handoff = await this.triggerPaintHandoff(component);
      handoffs.push(handoff);
    }
    
    // Check for piping-to-insulation handoff
    if (this.isPipingReadyForInsulation(component) && component.insulationSpec) {
      const handoff = await this.triggerInsulationHandoff(component);
      handoffs.push(handoff);
    }
    
    // Check for final turnover handoff
    if (this.isReadyForTurnover(component)) {
      const handoff = await this.triggerTurnoverHandoff(component);
      handoffs.push(handoff);
    }
    
    return handoffs;
  }
  
  private isPipingReadyForPaint(component: Component): boolean {
    // Paint can start after Connect milestone is complete
    const connectMilestone = component.milestones.find(m => m.milestoneName === 'Connect');
    return connectMilestone?.isCompleted === true;
  }
  
  private isPipingReadyForInsulation(component: Component): boolean {
    // Insulation can start after Test milestone is complete
    const testMilestone = component.milestones.find(m => m.milestoneName === 'Test');
    return testMilestone?.isCompleted === true;
  }
  
  private isReadyForTurnover(component: Component): boolean {
    const pipingComplete = component.completionPercent === 100;
    const paintComplete = !component.paintSpec || component.paintProgress?.completionPercent === 100;
    const insulationComplete = !component.insulationSpec || component.insulationProgress?.completionPercent === 100;
    
    return pipingComplete && paintComplete && insulationComplete;
  }
  
  private async triggerPaintHandoff(component: Component): Promise<HandoffResult> {
    // Update paint progress record with handoff notification
    await prisma.paintProgress.update({
      where: { componentId: component.id },
      data: {
        readyForWork: true,
        readyDate: new Date()
      }
    });
    
    // Notify paint subcontractor
    await this.notifyHandoff('paint', component);
    
    return {
      type: 'paint_handoff',
      componentId: component.id,
      timestamp: new Date(),
      success: true
    };
  }
}
```

## Performance Tracking and Metrics

### 1. Subcontractor Performance Dashboard

**Comprehensive performance metrics for subcontractor management:**

```typescript
interface SubcontractorPerformanceMetrics {
  // Overview metrics
  overview: {
    company: string;
    scope: 'paint' | 'insulation';
    activeProjects: number;
    assignedComponents: number;
    completedComponents: number;
    overallCompletionRate: number;
  };
  
  // Time-based metrics
  timeMetrics: {
    averageCompletionTimePerComponent: number; // hours
    averageCompletionTimeByType: Record<string, number>; // by component type
    onTimeDeliveryRate: number; // percentage
    productivityTrend: TimeSeriesData[]; // components per day over time
  };
  
  // Quality metrics
  qualityMetrics: {
    reworkRate: number; // percentage of work requiring rework
    firstTimeRightRate: number; // percentage completed correctly first time
    customerSatisfactionScore: number; // 1-10 scale
    safetyIncidents: number; // count per period
  };
  
  // Efficiency metrics
  efficiencyMetrics: {
    utilizationRate: number; // percentage of assigned time actively working
    componentsPerDay: number;
    costPerComponent: number; // if cost tracking enabled
    resourceEfficiency: number; // crew hours per component
  };
  
  // Comparative metrics
  benchmarks: {
    industryAverage: number;
    projectAverage: number;
    bestPerformer: number;
    ranking: number; // 1st, 2nd, etc. among subcontractors
  };
}
```

### 2. Real-Time Progress Tracking

**Live tracking of subcontractor activity:**

```typescript
export class SubcontractorActivityTracker {
  
  async trackActivity(
    userId: string,
    activity: {
      type: 'login' | 'progress_update' | 'bulk_update' | 'logout';
      componentId?: string;
      componentsCount?: number;
      location?: GeoLocation;
      duration?: number; // milliseconds
      metadata?: any;
    }
  ): Promise<void> {
    
    // Record activity in audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: activity.type,
        entityType: 'subcontractor_activity',
        entityId: activity.componentId || 'bulk',
        changes: activity.metadata,
        timestamp: new Date(),
        ipAddress: activity.metadata?.ipAddress,
        userAgent: activity.metadata?.userAgent
      }
    });
    
    // Update real-time metrics
    await this.updateRealTimeMetrics(userId, activity);
    
    // Broadcast to interested parties
    await this.broadcastActivity(userId, activity);
  }
  
  private async updateRealTimeMetrics(userId: string, activity: any): Promise<void> {
    const key = `subcontractor_metrics:${userId}:${new Date().toISOString().split('T')[0]}`;
    
    // Update Redis-based metrics (if available) or database
    await this.incrementMetric(key, 'activities', 1);
    
    if (activity.type === 'progress_update') {
      await this.incrementMetric(key, 'progress_updates', 1);
      await this.updateAverageTime(key, 'update_duration', activity.duration);
    }
    
    if (activity.type === 'bulk_update') {
      await this.incrementMetric(key, 'bulk_updates', 1);
      await this.incrementMetric(key, 'components_updated', activity.componentsCount);
    }
  }
}
```

### 3. Automated Performance Reporting

**Scheduled performance report generation:**

```typescript
export class SubcontractorReportGenerator {
  
  async generateWeeklyPerformanceReport(
    subcontractorCompanyId: string
  ): Promise<PerformanceReport> {
    
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    // Gather performance data
    const performanceData = await this.gatherPerformanceData(
      subcontractorCompanyId,
      weekStart,
      weekEnd
    );
    
    // Calculate metrics
    const metrics = await this.calculateWeeklyMetrics(performanceData);
    
    // Generate insights and recommendations
    const insights = await this.generateInsights(metrics);
    
    // Create report document
    const report: PerformanceReport = {
      company: performanceData.company,
      reportPeriod: { start: weekStart, end: weekEnd },
      metrics,
      insights,
      
      // Executive summary
      summary: {
        overallRating: this.calculateOverallRating(metrics),
        keyAchievements: insights.achievements,
        areasForImprovement: insights.improvements,
        nextWeekGoals: insights.goals
      },
      
      // Detailed breakdowns
      details: {
        dailyProductivity: performanceData.dailyBreakdown,
        projectBreakdown: performanceData.projectBreakdown,
        crewPerformance: performanceData.crewBreakdown
      },
      
      // Action items
      actionItems: insights.actionItems,
      
      generatedAt: new Date(),
      generatedBy: 'system'
    };
    
    return report;
  }
  
  private async generateInsights(metrics: any): Promise<ReportInsights> {
    const insights: ReportInsights = {
      achievements: [],
      improvements: [],
      goals: [],
      actionItems: []
    };
    
    // Achievement detection
    if (metrics.completionRate > 95) {
      insights.achievements.push('Exceptional completion rate of ' + metrics.completionRate + '%');
    }
    
    if (metrics.onTimeDelivery > 90) {
      insights.achievements.push('Strong on-time delivery performance');
    }
    
    // Improvement area detection
    if (metrics.reworkRate > 5) {
      insights.improvements.push('Rework rate above target - focus on quality procedures');
      insights.actionItems.push({
        description: 'Implement quality checkpoints',
        priority: 'high',
        assignedTo: 'quality_manager',
        dueDate: addWeeks(new Date(), 1)
      });
    }
    
    if (metrics.productivityTrend < 0) {
      insights.improvements.push('Declining productivity trend - investigate causes');
    }
    
    // Goal setting
    insights.goals.push('Maintain completion rate above 95%');
    insights.goals.push('Reduce rework rate to below 3%');
    
    return insights;
  }
}
```

## Integration with Project Management

### 1. Milestone Dependencies

**Integration with overall project milestones:**

```typescript
export class SubcontractorMilestoneIntegration {
  
  async updateProjectMilestoneStatus(
    projectId: string,
    milestoneType: 'paint' | 'insulation'
  ): Promise<MilestoneUpdate> {
    
    // Calculate completion percentage for this milestone type
    const completionData = await this.calculateScopeCompletion(projectId, milestoneType);
    
    // Update project milestone
    const milestone = await prisma.projectMilestone.upsert({
      where: {
        projectId_type: {
          projectId,
          type: milestoneType
        }
      },
      create: {
        projectId,
        type: milestoneType,
        name: `${milestoneType.charAt(0).toUpperCase() + milestoneType.slice(1)} Complete`,
        completionPercent: completionData.percentComplete,
        isComplete: completionData.percentComplete === 100,
        updatedAt: new Date()
      },
      update: {
        completionPercent: completionData.percentComplete,
        isComplete: completionData.percentComplete === 100,
        updatedAt: new Date()
      }
    });
    
    // Trigger downstream activities if milestone is complete
    if (milestone.isComplete && !milestone.downstreamTriggered) {
      await this.triggerDownstreamActivities(projectId, milestoneType);
      
      await prisma.projectMilestone.update({
        where: { id: milestone.id },
        data: { downstreamTriggered: true }
      });
    }
    
    return {
      milestone,
      completionData,
      downstreamTriggered: milestone.isComplete
    };
  }
  
  private async triggerDownstreamActivities(
    projectId: string,
    completedMilestoneType: 'paint' | 'insulation'
  ): Promise<void> {
    
    // Check if all specialty scopes are complete
    const allScopesComplete = await this.areAllScopesComplete(projectId);
    
    if (allScopesComplete) {
      // Trigger final project turnover activities
      await this.triggerProjectTurnover(projectId);
      
      // Notify project stakeholders
      await this.notifyProjectCompletion(projectId);
    }
  }
}
```

### 2. Communication and Notifications

**Automated communication system for subcontractor coordination:**

```typescript
export class SubcontractorCommunication {
  
  async sendWorkAssignmentNotification(
    assignment: ComponentAssignment[],
    subcontractorId: string
  ): Promise<void> {
    
    const subcontractor = await prisma.subcontractorCompany.findUnique({
      where: { id: subcontractorId },
      include: { users: true }
    });
    
    if (!subcontractor) return;
    
    // Prepare notification data
    const notificationData = {
      type: 'work_assignment',
      company: subcontractor.name,
      componentsCount: assignment.length,
      totalEstimatedTime: assignment.reduce((sum, a) => sum + a.estimatedTime, 0),
      dueDate: assignment[0]?.dueDate,
      priority: assignment[0]?.priority,
      projectName: assignment[0]?.project?.jobName
    };
    
    // Send notifications to all company users
    for (const user of subcontractor.users) {
      // Email notification
      await sendMail({
        to: user.email,
        template: 'subcontractor-work-assignment',
        context: {
          userName: user.name,
          ...notificationData
        }
      });
      
      // In-app notification
      await this.createInAppNotification(user.id, {
        title: 'New Work Assignment',
        message: `${assignment.length} components assigned for ${subcontractor.scope} work`,
        data: notificationData,
        priority: assignment[0]?.priority || 'normal'
      });
      
      // SMS notification for high priority (if phone number available)
      if (assignment[0]?.priority === 'urgent' && user.phoneNumber) {
        await this.sendSMSNotification(user.phoneNumber, {
          message: `URGENT: ${assignment.length} components assigned. Check PipeTrak app for details.`
        });
      }
    }
  }
  
  async sendProgressMilestoneAlert(
    componentId: string,
    milestone: 'piping_complete' | 'paint_ready' | 'insulation_ready' | 'turnover_ready'
  ): Promise<void> {
    
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      include: {
        project: true,
        paintProgress: { include: { assignedSubcontractor: true } },
        insulationProgress: { include: { assignedSubcontractor: true } }
      }
    });
    
    if (!component) return;
    
    let recipientScope: string;
    let message: string;
    
    switch (milestone) {
      case 'paint_ready':
        recipientScope = 'paint';
        message = `Component ${component.displayId} is ready for paint work`;
        break;
        
      case 'insulation_ready':
        recipientScope = 'insulation';
        message = `Component ${component.displayId} is ready for insulation work`;
        break;
        
      case 'turnover_ready':
        recipientScope = 'all';
        message = `Component ${component.displayId} is ready for turnover`;
        break;
        
      default:
        return;
    }
    
    // Find users in the target scope
    const targetUsers = await this.getUsersByScope(component.project.id, recipientScope);
    
    // Send notifications
    for (const user of targetUsers) {
      await this.createInAppNotification(user.id, {
        title: 'Component Ready',
        message,
        data: {
          componentId: component.id,
          displayId: component.displayId,
          milestone,
          location: `${component.area} - ${component.system}`
        },
        priority: 'normal'
      });
    }
  }
}
```

---

*Document Version: 1.0*  
*Author: Subcontractor Management Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Focus: Mobile-first design with role-based access control*