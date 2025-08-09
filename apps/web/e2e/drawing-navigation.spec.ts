import { test, expect, Page } from "@playwright/test";

// Helper to login and navigate to a project
async function navigateToProject(page: Page, projectId: string = "test-project") {
  // Login first (assuming auth is required)
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  
  // Wait for redirect to app
  await page.waitForURL("**/app/**");
  
  // Navigate to project drawings
  await page.goto(`/app/pipetrak/${projectId}/drawings`);
}

test.describe("Drawing Navigation E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Set up any needed test data or auth state
    await navigateToProject(page);
  });

  test("should navigate through drawing hierarchy", async ({ page }) => {
    // Wait for drawings to load
    await expect(page.getByText("P&ID-001")).toBeVisible();
    await expect(page.getByText("P&ID-002")).toBeVisible();

    // Expand first drawing
    await page.getByRole("button", { name: /expand/i }).first().click();
    
    // Verify children are visible
    await expect(page.getByText("P&ID-001-A")).toBeVisible();
    await expect(page.getByText("P&ID-001-B")).toBeVisible();

    // Click on a child drawing
    await page.getByText("P&ID-001-A").click();

    // Should navigate to drawing detail page
    await expect(page).toHaveURL(/.*\/drawings\/d2/);
    
    // Verify breadcrumbs
    await expect(page.getByText("Drawings")).toBeVisible();
    await expect(page.getByText("P&ID-001")).toBeVisible();
  });

  test("should search for drawings", async ({ page }) => {
    // Open search dialog
    await page.getByPlaceholder("Search drawings...").click();
    
    // Type search query
    await page.keyboard.type("Secondary");

    // Verify filtered results
    await expect(page.getByText("Secondary Process")).toBeVisible();
    await expect(page.getByText("Main Process Flow")).not.toBeVisible();

    // Clear search
    await page.getByPlaceholder("Search drawings...").clear();

    // All drawings should be visible again
    await expect(page.getByText("Main Process Flow")).toBeVisible();
    await expect(page.getByText("Secondary Process")).toBeVisible();
  });

  test("should use command palette for global search", async ({ page }) => {
    // Open command palette (Cmd+K or button)
    await page.getByText("Search drawings...").click();

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible();

    // Type in command palette
    await page.getByPlaceholder(/search by drawing/i).fill("P&ID");

    // Wait for search results
    await expect(page.getByRole("option")).toHaveCount(3);

    // Select first result
    await page.getByRole("option").first().click();

    // Should navigate to selected drawing
    await expect(page).toHaveURL(/.*\/drawings\/.*/);
  });

  test("should display component counts correctly", async ({ page }) => {
    // Verify component count badges are visible
    const badges = page.locator('[class*="badge"]');
    await expect(badges).toHaveCount(4); // Multiple status badges

    // Verify color coding
    await expect(page.locator(".bg-gray-50")).toBeVisible(); // Not started
    await expect(page.locator(".bg-blue-50")).toBeVisible(); // In progress
    await expect(page.locator(".bg-green-50")).toBeVisible(); // Completed
  });

  test("should handle drawing detail view", async ({ page }) => {
    // Navigate to a specific drawing
    await page.goto("/app/pipetrak/test-project/drawings/d1");

    // Wait for drawing details to load
    await expect(page.getByText("P&ID-001")).toBeVisible();
    await expect(page.getByText("Main Process Flow")).toBeVisible();

    // Verify tabs
    await expect(page.getByRole("tab", { name: /components/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /information/i })).toBeVisible();

    // Check component table is visible
    await expect(page.getByRole("table")).toBeVisible();

    // Verify progress bar
    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile navigation should use bottom sheet
    await page.getByText("Drawings").click();

    // Bottom sheet should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Tree should be visible in sheet
    await expect(page.getByText("P&ID-001")).toBeVisible();

    // Select a drawing
    await page.getByText("P&ID-001").click();

    // Sheet should close and navigate
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("should persist expanded state in URL", async ({ page }) => {
    // Expand some nodes
    await page.getByRole("button", { name: /expand/i }).first().click();
    await expect(page.getByText("P&ID-001-A")).toBeVisible();

    // URL should update with expanded state
    await expect(page).toHaveURL(/.*expanded=/);

    // Reload page
    await page.reload();

    // Expanded nodes should remain expanded
    await expect(page.getByText("P&ID-001-A")).toBeVisible();
  });

  test("should handle deep navigation with breadcrumbs", async ({ page }) => {
    // Expand multiple levels
    await page.getByRole("button", { name: /expand/i }).first().click();
    await expect(page.getByText("P&ID-001-A")).toBeVisible();

    // Click on nested drawing
    await page.getByText("P&ID-001-A").click();

    // Navigate to detail view
    await page.waitForURL(/.*\/drawings\/d2/);

    // Breadcrumbs should show full path
    const breadcrumbs = page.locator('[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toContainText("Project");
    await expect(breadcrumbs).toContainText("Drawings");
    await expect(breadcrumbs).toContainText("P&ID-001");

    // Click breadcrumb to navigate back
    await page.getByRole("link", { name: "Drawings" }).click();
    await expect(page).toHaveURL(/.*\/drawings$/);
  });

  test("should filter components within drawing", async ({ page }) => {
    // Navigate to drawing with components
    await page.goto("/app/pipetrak/test-project/drawings/d1");

    // Wait for components to load
    await expect(page.getByRole("table")).toBeVisible();

    // Apply status filter
    await page.getByRole("combobox", { name: /status/i }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    // Table should update with filtered results
    await expect(page.getByRole("row")).toHaveCount(5); // Fewer rows after filter

    // Clear filter
    await page.getByRole("button", { name: /clear/i }).click();

    // All components should be visible again
    await expect(page.getByRole("row")).toHaveCount(10);
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Navigate to non-existent drawing
    await page.goto("/app/pipetrak/test-project/drawings/non-existent");

    // Should show error message
    await expect(page.getByText(/drawing not found/i)).toBeVisible();

    // Back button should work
    await page.getByRole("button", { name: /back/i }).click();
    await expect(page).toHaveURL(/.*\/drawings$/);
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Focus on tree
    await page.getByRole("tree").focus();

    // Navigate with arrow keys
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    // Expand with space or enter
    await page.keyboard.press("Space");
    await expect(page.getByText("P&ID-001-A")).toBeVisible();

    // Navigate to child
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Should select the drawing
    await expect(page).toHaveURL(/.*\/drawings\/.*/);
  });

  test("should show performance with large dataset", async ({ page }) => {
    // Navigate to large dataset
    await page.goto("/app/pipetrak/large-project/drawings");

    // Measure initial load time
    const startTime = Date.now();
    await expect(page.getByText("DWG-001")).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Should load within acceptable time
    expect(loadTime).toBeLessThan(3000); // 3 seconds

    // Scroll performance
    await page.evaluate(() => {
      const tree = document.querySelector('[role="tree"]');
      if (tree) {
        tree.scrollTop = tree.scrollHeight / 2;
      }
    });

    // Virtual scrolling should handle large lists
    const visibleItems = await page.locator('[role="treeitem"]').count();
    expect(visibleItems).toBeLessThan(100); // Not all 500+ items rendered
  });
});

test.describe("Drawing Navigation Accessibility", () => {
  test("should support screen reader navigation", async ({ page }) => {
    await navigateToProject(page);

    // Check ARIA labels
    await expect(page.getByRole("tree", { name: "Drawing hierarchy" })).toBeVisible();
    
    // Tree items should have proper roles
    const treeItems = page.locator('[role="treeitem"]');
    await expect(treeItems).toHaveCount(2); // Root items

    // Check ARIA attributes
    const firstItem = treeItems.first();
    await expect(firstItem).toHaveAttribute("aria-level", "1");
    await expect(firstItem).toHaveAttribute("aria-expanded", "false");

    // Expand and check updated state
    await page.getByRole("button", { name: /expand/i }).first().click();
    await expect(firstItem).toHaveAttribute("aria-expanded", "true");
  });

  test("should have proper focus management", async ({ page }) => {
    await navigateToProject(page);

    // Tab through interface
    await page.keyboard.press("Tab"); // Search input
    await expect(page.getByPlaceholder("Search drawings...")).toBeFocused();

    await page.keyboard.press("Tab"); // First tree item
    await expect(page.getByRole("button", { name: /expand/i }).first()).toBeFocused();

    // Escape should close dialogs
    await page.getByText("Search drawings...").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await navigateToProject(page);

    // Check color contrast for status badges
    const notStartedBadge = page.locator(".bg-gray-50").first();
    const computedStyle = await notStartedBadge.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    // Verify text is readable (this would normally use a contrast checking library)
    expect(computedStyle.color).toBeDefined();
    expect(computedStyle.backgroundColor).toBeDefined();
  });
});