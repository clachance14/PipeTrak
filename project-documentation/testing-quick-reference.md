# PipeTrak Testing Quick Reference

## 🚀 Quick Commands

```bash
# Run all tests once
pnpm vitest run

# Watch mode (recommended for development)
pnpm vitest

# Test specific file/pattern
pnpm vitest ComponentTable
pnpm vitest run modules/pipetrak

# Test with UI
pnpm test:ui

# Coverage report
pnpm test:coverage

# From project root
pnpm --filter web test
```

## 🎯 Common Test Patterns

### Basic Component Test
```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component", () => {
  it("should handle clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Component onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Mock API Calls
```typescript
vi.mock("@shared/lib/api-client", () => ({
  apiClient: {
    pipetrak: {
      components: {
        $get: vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockData
        })
      }
    }
  }
}));
```

### Fix Radix UI Issues
```typescript
beforeEach(() => {
  // Add these for Select, Dialog, etc.
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
```

### Test Mobile View
```typescript
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375 // Mobile width
  });
  window.dispatchEvent(new Event('resize'));
});
```

## 🔍 Common Queries

```typescript
// By Role (Preferred)
screen.getByRole("button", { name: /submit/i })
screen.getByRole("textbox", { name: /email/i })
screen.getByRole("checkbox")
screen.getByRole("combobox")

// By Text
screen.getByText(/loading/i)
screen.getAllByText("Item") // Returns array

// By Placeholder
screen.getByPlaceholderText(/search/i)

// By Display Value
screen.getByDisplayValue("25")

// Async Queries (wait for element)
await screen.findByText("Loaded")
await screen.findByRole("button")
```

## 🎮 User Interactions

```typescript
const user = userEvent.setup();

// Click
await user.click(element);
await user.dblClick(element);

// Type
await user.type(input, "text");
await user.clear(input);

// Keyboard
await user.keyboard("{Enter}");
await user.keyboard("{Escape}");
await user.tab();

// Select
await user.selectOptions(select, "option-value");

// Upload
await user.upload(input, file);
```

## ✅ Common Assertions

```typescript
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).toBeDisabled();

// Content
expect(element).toHaveTextContent("text");
expect(input).toHaveValue("value");
expect(element).toHaveAttribute("aria-label", "label");

// Style
expect(element).toHaveClass("class-name");
expect(element).toHaveStyle({ minHeight: "52px" });

// Function Calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(1);
```

## 🐛 Debugging

```typescript
// Print DOM
screen.debug();
screen.debug(element);

// Log accessible roles
screen.logTestingPlaygroundURL();

// Use data-testid as last resort
<div data-testid="custom-element" />
screen.getByTestId("custom-element");
```

## 📊 Current Coverage

| Suite | Tests | Focus |
|-------|-------|-------|
| EnhancedDataTable | 20 | Virtual scroll, editing |
| API Actions | 19 | Data operations |
| ComponentTable | 18 | Filters, bulk ops |
| ComponentCard | 10 | Mobile UI |
| MilestoneUpdateCard | 14 | Workflows |
| **Total** | **81** | **All Passing ✅** |

## 🚨 Common Issues

### "Multiple elements found"
```typescript
// Use more specific query
const options = await screen.findAllByText("Text");
const targetOption = options[1]; // Get specific one
```

### "hasPointerCapture is not a function"
```typescript
// Add to beforeEach
Element.prototype.hasPointerCapture = vi.fn(() => false);
```

### "Cannot read properties of undefined"
```typescript
// Mock document methods correctly
const originalMethod = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tag) => {
  const element = originalMethod(tag);
  // Add custom behavior
  return element;
});
```

### Async Issues
```typescript
// Always use waitFor for async operations
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});
```

## 📝 Test File Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentName } from "../components/ComponentName";

// Mock dependencies
vi.mock("@shared/lib/api-client", () => ({
  apiClient: {
    // Mock API structure
  }
}));

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with props", () => {
      render(<ComponentName prop="value" />);
      expect(screen.getByText("Expected")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should handle user actions", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      
      render(<ComponentName onAction={onAction} />);
      
      await user.click(screen.getByRole("button"));
      
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty state", () => {
      render(<ComponentName items={[]} />);
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });
  });
});
```

---

*Quick reference for PipeTrak testing - Phase 3 (81 tests passing)*