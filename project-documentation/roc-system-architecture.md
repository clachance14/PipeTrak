# Rules of Credit (ROC) System - Technical Architecture

## Executive Summary

This document defines the technical architecture for implementing a comprehensive Rules of Credit (ROC) configuration and auto-assignment system in PipeTrak. The system will enable organizations to define credit weights by component type, automatically apply these rules during import, and maintain accurate progress calculations across all reporting.

## Current State Analysis

### Existing Implementation
- **Credit Weights**: Currently stored at `ComponentMilestone.creditWeight` level
- **Milestone Templates**: JSON-based milestone definitions in `MilestoneTemplate` table
- **Import System**: Basic import job processing without ROC assignment
- **Calculation**: Credit calculations happen in `MilestoneUpdateEngine.tsx`
- **Component Types**: Stored as string field on Component model

### Limitations
1. No centralized ROC configuration management
2. Credit weights must be manually set per milestone
3. Import process doesn't automatically assign ROC values
4. No component type to ROC mapping system
5. Organizations cannot customize ROC rules

## Proposed Architecture

### Core Design Principles
1. **Backward Compatibility**: Existing manual credit weights continue to work
2. **Organization Customization**: Each organization can define their own ROC rules
3. **Type-Based Assignment**: Automatic ROC assignment based on component type
4. **Import Integration**: ROC rules applied during file upload/import
5. **Performance**: Cached lookups for high-frequency calculations
6. **Audit Trail**: Track ROC rule changes and applications

## Data Model Design

### New Database Tables

```prisma
// ROC Configuration by Organization and Component Type
model ROCConfiguration {
    id              String   @id @default(cuid())
    organizationId  String
    organization    Organization @relation(fields: [organizationId], references: [id])
    projectId       String?  // Optional: project-specific override
    project         Project? @relation(fields: [projectId], references: [id])
    
    // Configuration details
    name            String   // e.g., "Standard Piping ROC", "Insulation ROC"
    description     String?
    componentType   String   // Maps to Component.type
    workflowType    String   // Maps to Component.workflowType
    
    // ROC weights by milestone name
    rocWeights      Json     /// @zod.custom.use(z.record(z.string(), z.number()))
    // Example: {"Receive": 5, "Erect": 30, "Connect": 30, ...}
    
    // Priority for resolution (higher wins)
    priority        Int      @default(0)
    isActive        Boolean  @default(true)
    
    // Audit fields
    createdBy       String
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    
    @@unique([organizationId, componentType, workflowType, projectId])
    @@index([organizationId, isActive])
    @@index([projectId, componentType])
}

// ROC Application Log for Audit Trail
model ROCApplicationLog {
    id              String   @id @default(cuid())
    componentId     String
    component       Component @relation(fields: [componentId], references: [id])
    
    // Applied configuration
    rocConfigId     String
    rocConfig       ROCConfiguration @relation(fields: [rocConfigId], references: [id])
    appliedWeights  Json     // Snapshot of applied weights
    
    // Application context
    appliedBy       String   // userId or "system"
    appliedAt       DateTime @default(now())
    source          String   // "import", "manual", "bulk_update"
    importJobId     String?  // If applied during import
    
    @@index([componentId])
    @@index([importJobId])
}

// Default ROC Templates (System-wide defaults)
model ROCTemplate {
    id              String   @id @default(cuid())
    name            String   @unique // e.g., "MVP_FULL", "MVP_REDUCED"
    description     String?
    componentTypes  String[] // Array of applicable types
    workflowType    String
    
    // Standard ROC weights
    rocWeights      Json     /// @zod.custom.use(z.record(z.string(), z.number()))
    
    // System template flag
    isSystem        Boolean  @default(false)
    isActive        Boolean  @default(true)
    
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
}
```

### Schema Updates

```prisma
// Update Component model
model Component {
    // ... existing fields ...
    
    // ROC tracking
    appliedROCConfigId  String?
    appliedROCConfig    ROCConfiguration? @relation(fields: [appliedROCConfigId], references: [id])
    rocOverrideWeights  Json?    // Manual overrides to ROC weights
    
    // ROC application logs
    rocApplicationLogs  ROCApplicationLog[]
}

// Update ImportJob model
model ImportJob {
    // ... existing fields ...
    
    // ROC processing
    rocConfigId         String?  // Which ROC config was used
    rocApplicationMode  String?  // "auto", "manual", "skip"
    rocSummary         Json?     // Summary of ROC applications
}
```

## ROC Resolution Algorithm

### Priority-Based Resolution
```typescript
interface ROCResolutionContext {
  organizationId: string;
  projectId?: string;
  componentType: string;
  workflowType: string;
}

async function resolveROCConfiguration(context: ROCResolutionContext): Promise<ROCConfiguration | null> {
  // Priority order (highest to lowest):
  // 1. Project-specific + exact type match
  // 2. Organization-specific + exact type match
  // 3. Organization-specific + workflow type match
  // 4. System default template
  
  const configs = await prisma.rOCConfiguration.findMany({
    where: {
      OR: [
        // Project-specific
        {
          projectId: context.projectId,
          componentType: context.componentType,
          isActive: true,
        },
        // Organization-specific
        {
          organizationId: context.organizationId,
          componentType: context.componentType,
          projectId: null,
          isActive: true,
        },
        // Workflow fallback
        {
          organizationId: context.organizationId,
          workflowType: context.workflowType,
          projectId: null,
          isActive: true,
        },
      ],
    },
    orderBy: [
      { priority: 'desc' },
      { projectId: 'desc' }, // Project configs win
      { componentType: 'desc' }, // Exact type match wins
    ],
  });
  
  return configs[0] || (await getSystemDefaultROC(context));
}
```

## Import System Integration

### Import Processing Pipeline

```typescript
// Enhanced import processing with ROC assignment
class ROCEnabledImportProcessor {
  async processImport(
    importJob: ImportJob,
    data: ComponentImportData[],
    options: ImportOptions
  ) {
    const rocMode = options.rocMode || 'auto';
    const rocResults = {
      assigned: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };
    
    // Phase 1: Data validation and enrichment
    const enrichedData = await this.enrichWithDrawingInfo(data);
    
    // Phase 2: ROC resolution for each component type
    const typeROCMap = await this.buildROCMap(enrichedData, importJob);
    
    // Phase 3: Create components with ROC assignment
    for (const batch of this.batchData(enrichedData)) {
      const components = await prisma.$transaction(async (tx) => {
        const created = [];
        
        for (const item of batch) {
          // Resolve ROC configuration
          const rocConfig = typeROCMap.get(item.type) || 
                           await this.resolveROC(item, importJob);
          
          // Create component with ROC
          const component = await tx.component.create({
            data: {
              ...item,
              appliedROCConfigId: rocConfig?.id,
              milestoneTemplateId: await this.resolveTemplate(item, rocConfig),
            },
          });
          
          // Create milestones with ROC weights
          if (rocConfig) {
            await this.createMilestonesWithROC(tx, component, rocConfig);
            rocResults.assigned++;
            
            // Log ROC application
            await tx.rOCApplicationLog.create({
              data: {
                componentId: component.id,
                rocConfigId: rocConfig.id,
                appliedWeights: rocConfig.rocWeights,
                appliedBy: 'system',
                source: 'import',
                importJobId: importJob.id,
              },
            });
          }
          
          created.push(component);
        }
        
        return created;
      });
      
      // Broadcast progress
      await broadcastImportProgress(importJob.id, {
        processed: rocResults.assigned + rocResults.skipped,
        total: enrichedData.length,
        rocAssigned: rocResults.assigned,
      });
    }
    
    // Phase 4: Update import job with ROC summary
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        rocSummary: rocResults,
        status: ImportStatus.COMPLETED,
      },
    });
    
    return rocResults;
  }
  
  private async createMilestonesWithROC(
    tx: PrismaTransaction,
    component: Component,
    rocConfig: ROCConfiguration
  ) {
    const template = await tx.milestoneTemplate.findUnique({
      where: { id: component.milestoneTemplateId },
    });
    
    const milestones = JSON.parse(template.milestones);
    const rocWeights = rocConfig.rocWeights;
    
    for (const milestone of milestones) {
      await tx.componentMilestone.create({
        data: {
          componentId: component.id,
          milestoneOrder: milestone.order,
          milestoneName: milestone.name,
          creditWeight: rocWeights[milestone.name] || milestone.weight || 0,
          isCompleted: false,
        },
      });
    }
  }
}
```

## API Contracts

### ROC Configuration Management API

```typescript
// GET /api/pipetrak/roc-config/:organizationId
interface GetROCConfigsResponse {
  configs: ROCConfiguration[];
  templates: ROCTemplate[];
  statistics: {
    totalConfigs: number;
    activeConfigs: number;
    componentsAffected: number;
  };
}

// POST /api/pipetrak/roc-config
interface CreateROCConfigRequest {
  organizationId: string;
  projectId?: string;
  name: string;
  componentType: string;
  workflowType: string;
  rocWeights: Record<string, number>;
  priority?: number;
}

// PUT /api/pipetrak/roc-config/:id
interface UpdateROCConfigRequest {
  name?: string;
  rocWeights?: Record<string, number>;
  priority?: number;
  isActive?: boolean;
}

// POST /api/pipetrak/roc-config/apply-bulk
interface BulkApplyROCRequest {
  projectId: string;
  componentIds?: string[]; // Optional: specific components
  componentTypes?: string[]; // Optional: by type
  rocConfigId: string;
  mode: 'override' | 'fill_empty';
}
```

### Import API Extensions

```typescript
// Enhanced import endpoint
// POST /api/pipetrak/import-jobs/process
interface ProcessImportRequest {
  importJobId: string;
  rocMode: 'auto' | 'manual' | 'skip';
  rocConfigOverrides?: {
    [componentType: string]: string; // ROC config ID
  };
  dryRun?: boolean;
}

interface ProcessImportResponse {
  status: 'success' | 'partial' | 'failed';
  componentsCreated: number;
  rocAssignments: {
    automatic: number;
    manual: number;
    skipped: number;
    failed: number;
  };
  errors?: ImportError[];
}
```

## Caching Strategy

### ROC Configuration Cache

```typescript
class ROCConfigCache {
  private cache: Map<string, CachedROCConfig> = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  getCacheKey(org: string, type: string, workflow: string, project?: string): string {
    return `${org}:${project || 'org'}:${type}:${workflow}`;
  }
  
  async getConfig(context: ROCResolutionContext): Promise<ROCConfiguration | null> {
    const key = this.getCacheKey(
      context.organizationId,
      context.componentType,
      context.workflowType,
      context.projectId
    );
    
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.config;
    }
    
    const config = await resolveROCConfiguration(context);
    if (config) {
      this.cache.set(key, {
        config,
        expiry: Date.now() + this.ttl,
      });
    }
    
    return config;
  }
  
  invalidate(organizationId: string, projectId?: string) {
    // Invalidate all entries for org/project
    for (const [key] of this.cache) {
      if (key.startsWith(`${organizationId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Migration Strategy

### Phase 1: Database Migration
```sql
-- Create new tables
CREATE TABLE ROCConfiguration (...);
CREATE TABLE ROCApplicationLog (...);
CREATE TABLE ROCTemplate (...);

-- Add columns to existing tables
ALTER TABLE Component 
  ADD COLUMN appliedROCConfigId VARCHAR(255),
  ADD COLUMN rocOverrideWeights JSON;

ALTER TABLE ImportJob
  ADD COLUMN rocConfigId VARCHAR(255),
  ADD COLUMN rocApplicationMode VARCHAR(50),
  ADD COLUMN rocSummary JSON;
```

### Phase 2: Seed Default Templates
```typescript
async function seedDefaultROCTemplates() {
  const templates = [
    {
      name: 'MVP_FULL',
      componentTypes: ['spool', 'piping-footage'],
      workflowType: 'milestone_discrete',
      rocWeights: {
        'Receive': 5,
        'Erect': 30,
        'Connect': 30,
        'Support': 15,
        'Punch': 5,
        'Test': 10,
        'Restore': 5,
      },
    },
    {
      name: 'MVP_REDUCED',
      componentTypes: ['support', 'valve', 'gasket', 'instrument', 'field_weld'],
      workflowType: 'milestone_discrete',
      rocWeights: {
        'Receive': 10,
        'Install/Connect': 60,
        'Punch': 10,
        'Test': 15,
        'Restore': 5,
      },
    },
    // ... other templates
  ];
  
  for (const template of templates) {
    await prisma.rOCTemplate.create({ data: { ...template, isSystem: true } });
  }
}
```

### Phase 3: Backfill Existing Components
```typescript
async function backfillROCForExistingComponents(organizationId: string) {
  const components = await prisma.component.findMany({
    where: {
      project: { organizationId },
      appliedROCConfigId: null,
    },
    include: { milestones: true },
  });
  
  for (const component of components) {
    const rocConfig = await resolveROCConfiguration({
      organizationId,
      projectId: component.projectId,
      componentType: component.type,
      workflowType: component.workflowType,
    });
    
    if (rocConfig) {
      // Update component
      await prisma.component.update({
        where: { id: component.id },
        data: { appliedROCConfigId: rocConfig.id },
      });
      
      // Update milestone weights
      for (const milestone of component.milestones) {
        const weight = rocConfig.rocWeights[milestone.milestoneName];
        if (weight !== undefined) {
          await prisma.componentMilestone.update({
            where: { id: milestone.id },
            data: { creditWeight: weight },
          });
        }
      }
    }
  }
}
```

## UI Components Required

### ROC Configuration Manager
- Organization-level ROC rules management
- Project-specific overrides
- Visual ROC weight editor
- Template selection and customization
- Bulk application tools

### Import Wizard Enhancement
- ROC mode selection (auto/manual/skip)
- ROC preview before import
- Type-to-ROC mapping display
- Override capability per type

### Component Details Enhancement
- Display applied ROC configuration
- Show ROC calculation breakdown
- Allow manual ROC override
- ROC application history

## Performance Considerations

### Database Indexes
```sql
-- Optimize ROC lookups
CREATE INDEX idx_roc_config_lookup 
  ON ROCConfiguration(organizationId, componentType, workflowType, isActive);

CREATE INDEX idx_roc_project_lookup 
  ON ROCConfiguration(projectId, componentType) 
  WHERE projectId IS NOT NULL;

-- Optimize audit queries
CREATE INDEX idx_roc_log_component 
  ON ROCApplicationLog(componentId, appliedAt DESC);
```

### Query Optimization
- Use database views for common ROC calculations
- Implement materialized views for reporting
- Batch ROC applications during import
- Cache frequently accessed configurations

## Security Considerations

### Access Control
```typescript
// ROC configuration requires admin role
async function canManageROC(userId: string, organizationId: string): Promise<boolean> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      role: { in: ['owner', 'admin'] },
    },
  });
  return !!membership;
}
```

### Audit Requirements
- Log all ROC configuration changes
- Track who applied ROC to components
- Maintain history of ROC weights
- Enable rollback capabilities

## Testing Strategy

### Unit Tests
- ROC resolution algorithm
- Weight calculation accuracy
- Cache invalidation logic
- Import processing with ROC

### Integration Tests
- End-to-end import with ROC assignment
- ROC configuration CRUD operations
- Bulk ROC application
- Migration scripts

### Performance Tests
- Import performance with ROC (target: <5% overhead)
- ROC lookup performance (target: <10ms)
- Cache effectiveness (target: >90% hit rate)

## Rollout Plan

### Phase 1: Foundation (Week 1-2)
- Deploy database schema changes
- Implement ROC configuration API
- Create default templates
- Basic caching layer

### Phase 2: Import Integration (Week 3-4)
- Enhance import processor
- Add ROC assignment logic
- Implement audit logging
- Test with sample data

### Phase 3: UI Implementation (Week 5-6)
- ROC configuration manager
- Import wizard enhancements
- Component detail updates
- Admin dashboard

### Phase 4: Migration & Testing (Week 7-8)
- Backfill existing data
- Performance optimization
- User acceptance testing
- Documentation

## Success Metrics

### Technical Metrics
- ROC assignment accuracy: >99%
- Import performance impact: <5%
- Cache hit rate: >90%
- Zero data loss during migration

### Business Metrics
- Reduced manual ROC entry time: 80% reduction
- Import processing time: 30% faster with auto-ROC
- Configuration errors: <1% of imports
- User satisfaction: >4.5/5 rating

## Risk Mitigation

### Risk: Performance degradation during import
**Mitigation**: Implement progressive enhancement with feature flag, optimize batch processing

### Risk: Incorrect ROC assignments
**Mitigation**: Dry-run mode, preview before commit, comprehensive audit trail

### Risk: Migration failures
**Mitigation**: Phased rollout, rollback procedures, data validation scripts

### Risk: User confusion with new system
**Mitigation**: Comprehensive documentation, training videos, guided setup wizard

## Appendix A: Default ROC Templates

### Full Milestone Set (Spools & Piping-footage)
- Receive: 5%
- Erect: 30%
- Connect: 30%
- Support: 15%
- Punch: 5%
- Test: 10%
- Restore: 5%

### Reduced Milestone Set
- Receive: 10%
- Install/Connect: 60%
- Punch: 10%
- Test: 15%
- Restore: 5%

### Threaded Pipe
- Fabricate: 25%
- Erect: 25%
- Connect: 30%
- Punch: 5%
- Test: 10%
- Restore: 5%

### Insulation
- Insulate: 60%
- Metal Out: 40%

### Paint
- Primer: 40%
- Finish Coat: 60%

## Appendix B: API Response Examples

### ROC Configuration Response
```json
{
  "id": "clh1234567890",
  "organizationId": "org_123",
  "name": "Standard Piping ROC",
  "componentType": "spool",
  "workflowType": "milestone_discrete",
  "rocWeights": {
    "Receive": 5,
    "Erect": 30,
    "Connect": 30,
    "Support": 15,
    "Punch": 5,
    "Test": 10,
    "Restore": 5
  },
  "priority": 100,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Import Job ROC Summary
```json
{
  "importJobId": "imp_987654321",
  "rocSummary": {
    "assigned": 1250,
    "skipped": 50,
    "failed": 0,
    "details": [
      {
        "componentType": "spool",
        "count": 500,
        "rocConfigId": "roc_123",
        "averageWeight": 100
      },
      {
        "componentType": "valve",
        "count": 750,
        "rocConfigId": "roc_456",
        "averageWeight": 75
      }
    ]
  }
}
```

---

*Document Version: 1.0*
*Author: Sarah (Product Owner)*
*Date: 2025-08-12*
*Status: Draft - Pending Technical Review*