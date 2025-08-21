/**
 * End-to-End Dashboard Tests
 * Tests complete user journeys and real browser interactions
 */

import { test, expect, Page } from '@playwright/test';

// Test data setup helpers
async function setupTestProject(page: Page) {
  // Navigate to dashboard
  await page.goto('/app/pipetrak/test-project-dashboard/dashboard');
  
  // Wait for authentication and data loading
  await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });
}

async function waitForDashboardLoad(page: Page) {
  // Wait for all dashboard components to load
  await Promise.all([
    page.waitForSelector('[data-testid="kpi-hero-bar"]'),
    page.waitForSelector('[data-testid="area-system-grid"]'),
    page.waitForSelector('[data-testid="drawing-hierarchy"]'),
    page.waitForSelector('[data-testid="test-package-table"]'),
    page.waitForSelector('[data-testid="activity-feed"]'),
  ]);
}

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication if needed
    await page.addInitScript(() => {
      // Set up any global test state
      window.__DASHBOARD_E2E_TEST__ = true;
    });
  });

  test.describe('Dashboard Loading and Navigation', () => {
    test('loads dashboard successfully', async ({ page }) => {
      await setupTestProject(page);
      
      // Verify page title and main elements
      await expect(page).toHaveTitle(/Dashboard/);
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Verify all dashboard sections are present
      await waitForDashboardLoad(page);
      
      // Take screenshot for visual regression testing
      await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
    });

    test('displays correct project information', async ({ page }) => {
      await setupTestProject(page);
      
      // Check project name in header
      await expect(page.locator('[data-testid="project-name"]')).toBeVisible();
      
      // Check project selector shows correct project
      const projectSelector = page.locator('[data-testid="project-selector"]');
      await expect(projectSelector).toContainText('Test Project Dashboard');
    });

    test('shows last updated timestamp', async ({ page }) => {
      await setupTestProject(page);
      
      // Verify timestamp is present and recent
      const timestamp = page.locator('text=/Last updated:/');
      await expect(timestamp).toBeVisible();
      
      // Timestamp should be within the last few minutes
      const timestampText = await timestamp.textContent();
      const now = new Date();
      const timestampMatch = timestampText?.match(/(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2})/);
      
      if (timestampMatch) {
        const timestampDate = new Date(timestampMatch[1]);
        const timeDiff = now.getTime() - timestampDate.getTime();
        expect(timeDiff).toBeLessThan(5 * 60 * 1000); // Within 5 minutes
      }
    });
  });

  test.describe('KPI Metrics Display', () => {
    test('displays all KPI cards correctly', async ({ page }) => {
      await setupTestProject(page);
      
      // Check all 5 KPI cards are present
      const kpiCards = page.locator('[data-testid="kpi-card"]');
      await expect(kpiCards).toHaveCount(5);
      
      // Verify specific KPI values
      await expect(page.locator('text="Overall %"')).toBeVisible();
      await expect(page.locator('text="Components"')).toBeVisible();
      await expect(page.locator('text="Active Drawings"')).toBeVisible();
      await expect(page.locator('text="Test Pkgs"')).toBeVisible();
      await expect(page.locator('text="Stalled"')).toBeVisible();
      
      // Check for numerical values (should be present)
      await expect(page.locator('text=/\d+%/')).toBeVisible(); // Percentage
      await expect(page.locator('text=/\d+\/\d+/')).toBeVisible(); // Component count
      await expect(page.locator('text=/\d+ ready/')).toBeVisible(); // Ready packages
    });

    test('stalled components card shows details', async ({ page }) => {
      await setupTestProject(page);
      
      const stalledCard = page.locator('[data-testid="kpi-card"]').filter({ hasText: 'Stalled' });
      
      // Check stalled breakdowns are present
      await expect(stalledCard.locator('text=/7d: \d+/')).toBeVisible();
      await expect(stalledCard.locator('text=/14d: \d+/')).toBeVisible();
      await expect(stalledCard.locator('text=/21d: \d+/')).toBeVisible();
    });

    test('KPI cards are responsive on different screen sizes', async ({ page }) => {
      await setupTestProject(page);
      
      // Desktop: should show all 5 cards in one row
      await page.setViewportSize({ width: 1200, height: 800 });
      const desktopCards = page.locator('[data-testid="kpi-card"]');
      await expect(desktopCards).toHaveCount(5);
      
      // Tablet: should adapt layout
      await page.setViewportSize({ width: 800, height: 600 });
      await expect(desktopCards).toHaveCount(5); // Still all cards visible
      
      // Mobile: should show simplified view
      await page.setViewportSize({ width: 400, height: 600 });
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Area System Grid Interactions', () => {
    test('grid displays with correct structure', async ({ page }) => {
      await setupTestProject(page);
      
      // Check grid container is present
      await expect(page.locator('[data-testid="area-system-grid"]')).toBeVisible();
      
      // Check for SVG grid
      const svg = page.locator('[data-testid="area-system-grid"] svg');
      await expect(svg).toBeVisible();
      
      // Check for area and system labels
      await expect(page.locator('text=/Area-\d+/')).toHaveCount({ min: 1 });
      await expect(page.locator('text=/System-\d+/')).toHaveCount({ min: 1 });
    });

    test('hovering shows tooltip with details', async ({ page }) => {
      await setupTestProject(page);
      
      // Hover over first grid cell
      const firstCell = page.locator('svg rect[class*="cursor-pointer"]').first();
      await firstCell.hover();
      
      // Should show tooltip
      await expect(page.locator('[data-testid="tooltip"]')).toBeVisible();
      
      // Tooltip should contain area and system info
      const tooltip = page.locator('[data-testid="tooltip"]');
      await expect(tooltip).toContainText(/Area-\d+ × System-\d+/);
      await expect(tooltip).toContainText(/\d+ of \d+ completed/);
    });

    test('clicking cell opens drill-down sheet', async ({ page }) => {
      await setupTestProject(page);
      
      // Click on first grid cell
      const firstCell = page.locator('svg rect[class*="cursor-pointer"]').first();
      await firstCell.click();
      
      // Should open drill-down sheet
      await expect(page.locator('[data-testid="drill-down-sheet"]')).toBeVisible();
      
      // Sheet should contain component details
      const sheet = page.locator('[data-testid="drill-down-sheet"]');
      await expect(sheet).toContainText(/Area-\d+ × System-\d+/);
      await expect(sheet).toContainText('Components in this combination:');
      
      // Should be able to close with X button
      await page.locator('[data-testid="close-drill-down"]').click();
      await expect(page.locator('[data-testid="drill-down-sheet"]')).not.toBeVisible();
    });

    test('grid shows color coding for completion levels', async ({ page }) => {
      await setupTestProject(page);
      
      // Check that grid cells have different colors based on completion
      const cells = page.locator('svg rect[fill]');
      const cellCount = await cells.count();
      
      expect(cellCount).toBeGreaterThan(0);
      
      // Check legend is present
      await expect(page.locator('text="0-30%"')).toBeVisible();
      await expect(page.locator('text="31-70%"')).toBeVisible();
      await expect(page.locator('text="71-100%"')).toBeVisible();
      await expect(page.locator('text="Has stalled components"')).toBeVisible();
    });
  });

  test.describe('Drawing Hierarchy Navigation', () => {
    test('displays drawing tree structure', async ({ page }) => {
      await setupTestProject(page);
      
      const hierarchy = page.locator('[data-testid="drawing-hierarchy"]');
      await expect(hierarchy).toBeVisible();
      
      // Should show drawing numbers
      await expect(page.locator('text=/DWG-\w+/')).toHaveCount({ min: 1 });
      
      // Should show completion percentages
      await expect(page.locator('text=/\d+% complete/')).toHaveCount({ min: 1 });
    });

    test('expanding parent shows child drawings', async ({ page }) => {
      await setupTestProject(page);
      
      // Find a parent drawing with expand button
      const expandButton = page.locator('[data-testid="expand-drawing"]').first();
      await expandButton.click();
      
      // Should show child drawings indented
      await expect(page.locator('[data-testid="child-drawing"]')).toBeVisible();
    });

    test('clicking drawing navigates to drawing detail', async ({ page }) => {
      await setupTestProject(page);
      
      // Click on first drawing
      const firstDrawing = page.locator('[data-testid="drawing-link"]').first();
      await firstDrawing.click();
      
      // Should navigate to drawing detail page
      await expect(page).toHaveURL(/\/drawing\/[^/]+/);
    });
  });

  test.describe('Test Package Management', () => {
    test('displays test package table correctly', async ({ page }) => {
      await setupTestProject(page);
      
      const packageTable = page.locator('[data-testid="test-package-table"]');
      await expect(packageTable).toBeVisible();
      
      // Check table headers
      await expect(page.locator('text="Package Name"')).toBeVisible();
      await expect(page.locator('text="Components"')).toBeVisible();
      await expect(page.locator('text="Completion %"')).toBeVisible();
      await expect(page.locator('text="Ready"')).toBeVisible();
    });

    test('sorting by completion percentage works', async ({ page }) => {
      await setupTestProject(page);
      
      // Click completion percentage header to sort
      await page.locator('text="Completion %"').click();
      
      // Should reorder rows (check that order changes)
      const firstRowBefore = await page.locator('[data-testid="package-row"]').first().textContent();
      
      // Click again to reverse sort
      await page.locator('text="Completion %"').click();
      
      const firstRowAfter = await page.locator('[data-testid="package-row"]').first().textContent();
      
      // Rows should be in different order
      expect(firstRowBefore).not.toBe(firstRowAfter);
    });

    test('ready badge displays correctly', async ({ page }) => {
      await setupTestProject(page);
      
      // Check for ready badges on completed packages
      const readyBadges = page.locator('[data-testid="ready-badge"]');
      const readyCount = await readyBadges.count();
      
      if (readyCount > 0) {
        await expect(readyBadges.first()).toContainText('Ready');
      }
      
      // Check for not ready indicators
      const notReadyRows = page.locator('[data-testid="package-row"]').filter({ hasText: 'Not Ready' });
      const notReadyCount = await notReadyRows.count();
      
      expect(readyCount + notReadyCount).toBeGreaterThan(0);
    });
  });

  test.describe('Activity Feed', () => {
    test('displays recent activity correctly', async ({ page }) => {
      await setupTestProject(page);
      
      const activityFeed = page.locator('[data-testid="activity-feed"]');
      await expect(activityFeed).toBeVisible();
      
      // Should show activity items
      await expect(page.locator('[data-testid="activity-item"]')).toHaveCount({ min: 1 });
      
      // Activity items should have timestamps and user names
      await expect(page.locator('text=/\d+ hours? ago|\d+ minutes? ago|Just now/')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toHaveCount({ min: 1 });
    });

    test('filtering by user works', async ({ page }) => {
      await setupTestProject(page);
      
      // Click user filter dropdown
      await page.locator('[data-testid="activity-user-filter"]').click();
      
      // Select specific user
      const userOption = page.locator('[data-testid="user-option"]').first();
      const userName = await userOption.textContent();
      await userOption.click();
      
      // Should filter activities to only show that user
      const activityItems = page.locator('[data-testid="activity-item"]');
      const itemCount = await activityItems.count();
      
      for (let i = 0; i < itemCount; i++) {
        await expect(activityItems.nth(i)).toContainText(userName || '');
      }
    });

    test('activity sparklines render correctly', async ({ page }) => {
      await setupTestProject(page);
      
      // Check for sparkline elements
      const sparklines = page.locator('[data-testid="activity-sparkline"]');
      const sparklineCount = await sparklines.count();
      
      if (sparklineCount > 0) {
        // Should have SVG elements
        await expect(sparklines.first().locator('svg')).toBeVisible();
      }
    });
  });

  test.describe('Manual Refresh Functionality', () => {
    test('refresh button updates dashboard data', async ({ page }) => {
      await setupTestProject(page);
      
      // Get initial timestamp
      const initialTimestamp = await page.locator('text=/Last updated:/')
        .textContent();
      
      // Wait to ensure timestamp will change
      await page.waitForTimeout(2000);
      
      // Click refresh button
      await page.locator('[data-testid="refresh-button"]').click();
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
      
      // Should update timestamp
      await page.waitForFunction(
        (initial) => {
          const current = document.querySelector('text=/Last updated:/')?.textContent;
          return current !== initial;
        },
        initialTimestamp,
        { timeout: 10000 }
      );
    });

    test('refresh handles errors gracefully', async ({ page }) => {
      await setupTestProject(page);
      
      // Simulate network error by intercepting requests
      await page.route('**/rpc/get_dashboard_metrics', (route) => {
        route.abort('failed');
      });
      
      // Click refresh
      await page.locator('[data-testid="refresh-button"]').click();
      
      // Should show error message
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
      await expect(page.locator('text="Unable to load dashboard metrics"')).toBeVisible();
    });
  });

  test.describe('Mobile Responsive Behavior', () => {
    test('mobile layout displays correctly', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      await setupTestProject(page);
      
      // Should show mobile dashboard
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      
      // Should show mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      
      // Should not show desktop components
      await expect(page.locator('[data-testid="area-system-grid"]')).not.toBeVisible();
    });

    test('mobile bottom sheet interactions work', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      await setupTestProject(page);
      
      // Tap to open bottom sheet
      await page.locator('[data-testid="open-bottom-sheet"]').click();
      
      // Should show bottom sheet with component list
      await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
      await expect(page.locator('[data-testid="component-list"]')).toBeVisible();
      
      // Should be able to swipe down to close
      const sheet = page.locator('[data-testid="mobile-bottom-sheet"]');
      await sheet.dragTo(sheet, {
        sourcePosition: { x: 200, y: 100 },
        targetPosition: { x: 200, y: 300 }
      });
      
      await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).not.toBeVisible();
    });
  });

  test.describe('Performance and User Experience', () => {
    test('dashboard loads within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await setupTestProject(page);
      await waitForDashboardLoad(page);
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Log performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-paint')?.startTime || 0,
        };
      });
      
      console.log('Performance metrics:', metrics);
      
      // Reasonable performance thresholds
      expect(metrics.domContentLoaded).toBeLessThan(2000);
      expect(metrics.firstPaint).toBeLessThan(1500);
    });

    test('large dataset renders without blocking UI', async ({ page }) => {
      // Navigate to project with large dataset
      await page.goto('/app/pipetrak/large-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 15000 });
      
      // Should remain responsive during rendering
      const startTime = Date.now();
      
      // Interact with UI while large dataset is rendering
      await page.locator('[data-testid="refresh-button"]').click();
      
      const clickResponseTime = Date.now() - startTime;
      
      // UI should remain responsive (click should register quickly)
      expect(clickResponseTime).toBeLessThan(500);
    });

    test('smooth scrolling and interactions', async ({ page }) => {
      await setupTestProject(page);
      
      // Test smooth scrolling in various components
      const scrollableElements = [
        '[data-testid="drawing-hierarchy"]',
        '[data-testid="test-package-table"]',
        '[data-testid="activity-feed"]'
      ];
      
      for (const selector of scrollableElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          // Scroll within the element
          await element.evaluate((el) => {
            el.scrollTop = 100;
          });
          
          // Scroll should be smooth (no jank)
          await page.waitForTimeout(100);
        }
      }
    });
  });

  test.describe('Browser Compatibility', () => {
    test('works in different browsers', async ({ page, browserName }) => {
      await setupTestProject(page);
      
      // Dashboard should load in all browsers
      await waitForDashboardLoad(page);
      
      // Take browser-specific screenshots
      await page.screenshot({ 
        path: `test-results/dashboard-${browserName}.png`, 
        fullPage: true 
      });
      
      // Basic functionality should work
      await page.locator('[data-testid="refresh-button"]').click();
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
    });

    test('handles browser resize events', async ({ page }) => {
      await setupTestProject(page);
      
      // Test various viewport sizes
      const viewports = [
        { width: 320, height: 568 },   // iPhone SE
        { width: 768, height: 1024 },  // iPad
        { width: 1024, height: 768 },  // iPad Landscape
        { width: 1440, height: 900 },  // Desktop
        { width: 1920, height: 1080 }, // Large Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Allow layout to settle
        
        // Dashboard should remain functional
        await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
        
        // Take screenshot for visual regression testing
        await page.screenshot({ 
          path: `test-results/dashboard-${viewport.width}x${viewport.height}.png`
        });
      }
    });
  });
});