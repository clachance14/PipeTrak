# Breaking Changes and Migration Guide

This document tracks breaking changes and provides migration guidance for the PipeTrak application.

## Migration Format

Each entry should include:
- **Version/Date**: When the change was introduced
- **Type**: Database, API, UI Component, or Configuration change
- **Description**: What changed and why
- **Migration Steps**: How to update existing code/data
- **Breaking**: Whether this requires immediate action

---

## 2025-01-09 - TypeScript Configuration Enhancement

**Type**: Configuration  
**Breaking**: No (backward compatible)

### Changes Made
- Enhanced TypeScript compiler options for better type safety
- Added stricter checking: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- Configured pre-commit hooks with type checking
- Added CI/CD pipeline type checking validation

### Migration Steps
- No action required for existing code
- New code will be subject to stricter type checking
- Pre-commit hooks will catch issues before they reach CI/CD

---

## 2025-01-09 - Button/Badge Component Prop Standardization

**Type**: UI Component  
**Breaking**: Yes (for incorrect usage)

### Changes Made
- Clarified Button component uses `variant` prop (not `status`)
- Clarified Badge component uses `status` prop (not `variant`)
- Created component usage documentation

### Migration Steps
**For Button components:**
```diff
- <Button status="primary">Save</Button>
+ <Button variant="primary">Save</Button>
```

**For Badge components:**
```diff
- <Badge variant="success">Completed</Badge>
+ <Badge status="success">Completed</Badge>
```

### Available Values
- **Button variants**: `primary`, `error`, `outline`, `secondary`, `light`, `ghost`, `link`
- **Badge status**: `success`, `info`, `warning`, `error`

---

## 2025-01-09 - Next.js 15 Route Handler Updates

**Type**: API  
**Breaking**: Yes (for route handlers)

### Changes Made
- Updated route handlers to support Next.js 15 async params pattern
- Changed from synchronous to asynchronous parameter access

### Migration Steps
**API Route Handlers:**
```diff
- export async function GET(request: Request, { params }: { params: { id: string } }) {
-   const { id } = params;
+ export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
+   const { id } = await params;
```

### Files Updated
- `apps/web/app/api/pipetrak/welders/[id]/route.ts`
- All parameterized route handlers throughout the application

---

## 2025-01-09 - Database Schema Field Name Updates

**Type**: Database  
**Breaking**: Yes (for direct database queries)

### Changes Made
- Updated Project model field from `name` to `jobName` to align with database schema
- Fixed Prisma query patterns for project relations

### Migration Steps
**Prisma Queries:**
```diff
- const project = await prisma.project.findFirst({ 
-   where: { name: projectName }
- });
+ const project = await prisma.project.findFirst({ 
+   where: { jobName: projectName }
+ });
```

**Component Relations:**
```diff
- include: { project: true, _count: { welders: true } }
+ include: { 
+   project: { select: { id: true, jobName: true } }, 
+   _count: { welders: true } 
+ }
```

---

## Future Migration Planning

### Component Status Type Safety
Consider standardizing component status handling:
- Use `ComponentStatus` enum consistently
- Implement proper type guards for status transitions
- Standardize status-to-badge mapping functions

### Import System Enhancements
Potential breaking changes for import validation:
- Enhanced CSV validation with better error reporting
- Standardized field mapping for different import types
- Type-safe import preview interfaces

### Milestone System Updates
Future milestone template changes may require:
- Migration of existing milestone data
- Updates to ROC calculation formulas
- Changes to progress tracking interfaces

---

## Best Practices for Future Changes

1. **Document Before Implementing**: Add entry to this file before making breaking changes
2. **Version Compatibility**: Maintain backward compatibility when possible
3. **Migration Scripts**: Provide database migration scripts for schema changes
4. **Component Versioning**: Use deprecation warnings before removing component props
5. **API Versioning**: Version API endpoints when making breaking changes
6. **Testing Coverage**: Ensure comprehensive test coverage for migrations

## Getting Help

If you encounter issues during migration:
1. Check the specific error message against this guide
2. Search for related issues in the codebase
3. Reference the component usage documentation in `/docs/COMPONENT_USAGE.md`
4. Use TypeScript intellisense to verify correct prop usage

## Review Process

This migration guide should be:
- Updated whenever breaking changes are introduced
- Reviewed during major version updates
- Referenced during onboarding of new developers
- Maintained as part of the project documentation standards