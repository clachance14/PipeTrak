# Component Usage Guidelines

This document provides clear guidelines for using UI components in the PipeTrak application to prevent TypeScript errors and ensure consistent prop usage.

## Button Component

**Location**: `apps/web/modules/ui/components/button.tsx`

### Prop Interface
```typescript
export type ButtonProps = {
  asChild?: boolean;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;
```

### Key Props
- **variant**: `"primary" | "error" | "outline" | "secondary" | "light" | "ghost" | "link"`
- **size**: `"md" | "sm" | "lg" | "icon"`
- **loading**: `boolean` - Shows spinner when true
- **asChild**: `boolean` - Renders as a child component via Radix Slot

### ⚠️ Common Mistake
**NEVER use `status` prop** - Button uses `variant`, not `status`

### Correct Usage
```typescript
// ✅ Correct
<Button variant="primary" size="md">Save</Button>
<Button variant="error" loading={isLoading}>Delete</Button>
<Button variant="outline">Cancel</Button>

// ❌ Incorrect - will cause TypeScript errors
<Button status="primary">Save</Button>
```

### Available Variants
- `primary`: Primary action button (blue)
- `error`: Destructive actions (red) 
- `outline`: Secondary actions with border
- `secondary`: Secondary actions (gray)
- `light`: Light background variant
- `ghost`: Transparent with hover effects
- `link`: Text button with underline

## Badge Component

**Location**: `apps/web/modules/ui/components/badge.tsx`

### Prop Interface
```typescript
export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badge>;
```

### Key Props
- **status**: `"success" | "info" | "warning" | "error"`

### ⚠️ Common Mistake  
**NEVER use `variant` prop** - Badge uses `status`, not `variant`

### Correct Usage
```typescript
// ✅ Correct
<Badge status="success">Completed</Badge>
<Badge status="error">Failed</Badge>
<Badge status="warning">In Progress</Badge>
<Badge status="info">Pending</Badge>

// ❌ Incorrect - will cause TypeScript errors
<Badge variant="success">Completed</Badge>
```

### Available Status Types
- `success`: Green badge for completed/successful states
- `info`: Blue badge for informational states (default)
- `warning`: Yellow badge for warning states
- `error`: Red badge for error/failed states

## Component Status Types

### ComponentStatus Enum
For PipeTrak component status tracking:

```typescript
export enum ComponentStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
}
```

### Status to Badge Mapping
When displaying component status in badges:

```typescript
const getStatusBadge = (componentStatus: ComponentStatus) => {
  const statusMap = {
    [ComponentStatus.NOT_STARTED]: "info",
    [ComponentStatus.IN_PROGRESS]: "warning", 
    [ComponentStatus.COMPLETED]: "success",
    [ComponentStatus.ON_HOLD]: "error",
  } as const;
  
  return <Badge status={statusMap[componentStatus]}>{componentStatus}</Badge>;
};
```

## Quick Reference

| Component | Variant Prop | Available Values |
|-----------|--------------|------------------|
| **Button** | `variant` | `primary`, `error`, `outline`, `secondary`, `light`, `ghost`, `link` |
| **Badge** | `status` | `success`, `info`, `warning`, `error` |

## Migration Notes

If you encounter TypeScript errors:

1. **Button errors**: Replace `status` with `variant`
   ```diff
   - <Button status="primary">
   + <Button variant="primary">
   ```

2. **Badge errors**: Ensure using `status` not `variant`
   ```diff
   - <Badge variant="success">
   + <Badge status="success">
   ```

## Type Safety Tips

1. Always import proper types:
   ```typescript
   import type { ButtonProps } from "@ui/components/button";
   import type { BadgeProps } from "@ui/components/badge";
   ```

2. Use TypeScript's intellisense to verify prop names before committing code

3. Run `pnpm typecheck` regularly during development to catch prop errors early

4. Enable pre-commit hooks (already configured) to prevent prop errors from reaching CI/CD

This documentation should be consulted whenever working with Button or Badge components to prevent the prop confusion that caused deployment blocking TypeScript errors.