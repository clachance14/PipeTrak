# PipeTrak Testing Guide

## Overview

This guide documents the testing infrastructure, patterns, and best practices for the PipeTrak application. The project uses Vitest for unit and integration testing, with React Testing Library for component testing.

## Current Test Coverage

As of January 8, 2025, Phase 3 implementation:

### Test Statistics
- **Total Tests**: 81 passing tests
- **Test Files**: 5 test suites
- **Coverage Areas**: Components, API actions, UI interactions, mobile responsiveness

### Test Suite Breakdown
| Component | Tests | Status | Coverage Focus |
|-----------|-------|--------|----------------|
| EnhancedDataTable | 20/20 | ✅ Passing | Virtual scrolling, editing, pagination, sorting |
| API Actions | 19/19 | ✅ Passing | Data fetching, updates, transformations |
| ComponentTable | 18/18 | ✅ Passing | Filtering, export, refresh, bulk operations |
| ComponentCard | 10/10 | ✅ Passing | Mobile UI, touch targets, quick actions |
| MilestoneUpdateCard | 14/14 | ✅ Passing | Workflow types, validation, dependencies |

## Testing Stack

### Core Libraries
- **Vitest**: Fast unit test framework with HMR support
- **React Testing Library**: Component testing with user-centric approach
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **@testing-library/user-event**: Simulating user interactions

### Configuration Files
- `apps/web/vitest.config.ts` - Main test configuration
- `apps/web/vitest.setup.ts` - Global test setup

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm vitest run

# Run tests in watch mode (recommended for development)
pnpm vitest

# Run tests for a specific file/pattern
pnpm vitest ComponentTable
pnpm vitest run modules/pipetrak

# Run tests with UI interface
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Test Execution from Different Directories

```bash
# From project root
pnpm --filter web test

# From apps/web directory
pnpm test

# Using npx directly
npx vitest run
```

## Testing Patterns & Best Practices

### 1. Component Testing Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  const mockProps = {
    // Define mock props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render component with data", () => {
    render(<Component {...mockProps} />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const user = userEvent.setup();
    render(<Component {...mockProps} />);
    
    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });
});
```

### 2. API Mocking Pattern

```typescript
// Mock API client
vi.mock("@shared/lib/api-client", () => ({
  apiClient: {
    pipetrak: {
      components: {
        $get: vi.fn(),
        ":id": {
          $patch: vi.fn(),
        },
      },
    },
  },
}));

// In test
const { apiClient } = await import("@shared/lib/api-client");
const mockGet = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
(apiClient.pipetrak.components.$get as any) = mockGet;
```

### 3. Testing Radix UI Components

Radix UI components (like Select, Dialog) require special handling in tests:

```typescript
beforeEach(() => {
  // Mock pointer capture methods
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  
  // Mock scrollIntoView
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});
```

### 4. Testing Mobile Responsiveness

```typescript
describe("Mobile View", () => {
  beforeEach(() => {
    // Mock window.innerWidth for mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile width
    });
    window.dispatchEvent(new Event('resize'));
  });

  it("should render card view on mobile", () => {
    render(<ComponentTable {...props} />);
    expect(screen.getByTestId("card-view")).toBeInTheDocument();
  });
});
```

### 5. Testing Touch Targets

```typescript
it("should have 52px touch targets for field use", () => {
  render(<ComponentCard {...props} touchTargetSize={52} />);
  
  const button = screen.getByRole("button", { name: /start/i });
  expect(button).toHaveStyle({ minHeight: "52px" });
});
```

## Common Testing Scenarios

### Testing Data Tables

```typescript
describe("Data Table", () => {
  it("should handle virtual scrolling for large datasets", () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: `item-${i}`,
      // ... other properties
    }));
    
    render(<EnhancedDataTable data={largeDataset} />);
    // Only visible rows should be rendered
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeLessThan(100);
  });

  it("should handle inline editing", async () => {
    const user = userEvent.setup();
    const onCellUpdate = vi.fn();
    
    render(<EnhancedDataTable onCellUpdate={onCellUpdate} />);
    
    const cell = screen.getByText("Editable Value");
    await user.dblClick(cell);
    
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Value");
    await user.keyboard("{Enter}");
    
    expect(onCellUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "New Value"
    );
  });
});
```

### Testing Filters

```typescript
describe("Filtering", () => {
  it("should filter by multiple criteria", async () => {
    const user = userEvent.setup();
    render(<ComponentTable components={mockComponents} />);
    
    // Apply search filter
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "VALVE");
    
    // Apply status filter
    const statusSelect = screen.getAllByRole("combobox")[3];
    await user.click(statusSelect);
    const completedOption = await screen.findByRole("option", { name: "Completed" });
    await user.click(completedOption);
    
    // Verify filtered results
    expect(screen.queryByText("PIPE-001")).not.toBeInTheDocument();
    expect(screen.getByText("VALVE-001")).toBeInTheDocument();
  });
});
```

### Testing Form Validation

```typescript
describe("Form Validation", () => {
  it("should validate milestone updates", async () => {
    const user = userEvent.setup();
    render(<MilestoneUpdateCard milestone={mockMilestone} workflowType="PERCENTAGE" />);
    
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "150"); // Over 100%
    
    // Should cap at 100
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
  });
});
```

## Known Issues & Workarounds

### 1. Select Component Interactions

**Issue**: Radix UI Select components require special handling for pointer events and scrolling.

**Solution**: Add mock implementations in `beforeEach`:
```typescript
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.scrollIntoView = vi.fn();
```

### 2. Multiple Elements Found

**Issue**: When testing, table cells and dropdown options may have duplicate text.

**Solution**: Use more specific queries or array indexing:
```typescript
const options = await screen.findAllByText("Process System");
const dropdownOption = options[1]; // Second occurrence is in dropdown
```

### 3. Document.createElement Recursion

**Issue**: Mocking document.createElement can cause recursion.

**Solution**: Store original implementation:
```typescript
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tagName) => {
  const element = originalCreateElement(tagName);
  // Add custom behavior
  return element;
});
```

## Testing Checklist for New Features

When adding new features, ensure you test:

- [ ] **Rendering**: Component renders without errors
- [ ] **Props**: All props work as expected
- [ ] **User Interactions**: Clicks, typing, keyboard navigation
- [ ] **State Management**: State updates correctly
- [ ] **API Calls**: Mocked API calls are made with correct parameters
- [ ] **Error Handling**: Errors are caught and displayed properly
- [ ] **Loading States**: Loading indicators appear during async operations
- [ ] **Empty States**: Appropriate messages when no data
- [ ] **Mobile Responsiveness**: Works on mobile viewports
- [ ] **Touch Targets**: Minimum 44px (52px for field use)
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Performance**: Virtual scrolling for large datasets

## Performance Testing

### Virtual Scrolling
```typescript
it("should enable virtual scrolling for >100 items", () => {
  const manyComponents = Array.from({ length: 150 }, (_, i) => 
    createMockComponent(`comp-${i}`)
  );
  
  render(<ComponentTable components={manyComponents} />);
  
  // Check that virtualization is active
  const table = screen.getByRole("table");
  expect(table).toHaveAttribute("data-virtualized", "true");
});
```

### Large Dataset Handling
```typescript
it("should handle 10k+ rows efficiently", () => {
  const start = performance.now();
  
  render(<EnhancedDataTable data={largeDataset} />);
  
  const renderTime = performance.now() - start;
  expect(renderTime).toBeLessThan(1500); // Should render in <1.5s
});
```

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:ci
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:related"
    }
  }
}
```

## Future Testing Improvements

### Planned Enhancements
1. **E2E Testing with Playwright**
   - Complete user journeys
   - Cross-browser testing
   - Mobile device emulation

2. **Visual Regression Testing**
   - Screenshot comparison
   - Component style validation
   - Responsive design verification

3. **Performance Benchmarks**
   - Load time metrics
   - Memory usage monitoring
   - API response time tracking

4. **Accessibility Testing**
   - WCAG compliance checks
   - Screen reader compatibility
   - Keyboard navigation validation

### Coverage Goals
- Unit Test Coverage: >80%
- Integration Test Coverage: >70%
- E2E Critical Paths: 100%

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Internal Documentation
- [Project Guidelines](./CLAUDE.md)
- [Architecture Documentation](./architecture-output.md)
- [Build Plan](./build-plan.md)

## Maintenance

### Adding New Test Suites
1. Create test file adjacent to component: `Component.test.tsx`
2. Follow existing patterns for consistency
3. Add to this documentation's coverage table
4. Ensure CI passes before merging

### Updating Test Infrastructure
1. Test changes in isolation first
2. Update all affected test files
3. Document any new patterns or workarounds
4. Update this guide with learnings

---

*Last Updated: January 8, 2025*  
*Phase 3 Implementation - 81 tests passing*