/**
 * Dashboard Integration Tests
 * Tests complete dashboard data flow from RPC to UI components
 */

import { test, expect } from '@playwright/test';
import { setupServer } from 'msw/node';
import { dashboardHandlers, dashboardMockControls } from '../modules/pipetrak/dashboard/__mocks__/dashboard-handlers';

// Setup MSW server for API mocking
const server = setupServer(...dashboardHandlers);

test.beforeAll(async () => {
  server.listen();
});

test.afterEach(async () => {
  server.resetHandlers();
  dashboardMockControls.reset();
});

test.afterAll(async () => {
  server.close();
});

test.describe('Dashboard Integration', () => {
  test.describe('Data Loading Flow', () => {
    test('loads dashboard with small project data', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Verify KPI metrics are displayed
      await expect(page.locator('text=60%')).toBeVisible(); // Overall completion
      await expect(page.locator('text=6 / 10')).toBeVisible(); // Components
      await expect(page.locator('text=2')).toBeVisible(); // Active drawings
      await expect(page.locator('text=1 ready')).toBeVisible(); // Test packages
      
      // Verify stalled components display
      await expect(page.locator('text=7d: 1')).toBeVisible();
      await expect(page.locator('text=14d: 1')).toBeVisible();
      await expect(page.locator('text=21d: 0')).toBeVisible();
    });

    test('loads dashboard with empty project data', async ({ page }) => {
      await page.goto('/app/pipetrak/empty-project/dashboard');
      
      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Verify empty state is displayed
      await expect(page.locator('text=0%')).toBeVisible(); // Overall completion
      await expect(page.locator('text=0 / 0')).toBeVisible(); // Components
      await expect(page.locator('text=0 ready')).toBeVisible(); // Test packages
      
      // Verify empty data messages
      await expect(page.locator('text=No area/system data available')).toBeVisible();
      await expect(page.locator('text=No drawings with components found')).toBeVisible();
      await expect(page.locator('text=No test packages configured')).toBeVisible();
      await expect(page.locator('text=No recent activity')).toBeVisible();
    });

    test('handles large dataset performance', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Measure load time
      const startTime = Date.now();
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      const endTime = Date.now();
      
      // Should load within performance budget
      expect(endTime - startTime).toBeLessThan(3000); // 3 second budget
      
      // Verify large dataset is displayed
      await expect(page.locator('text=68.5%')).toBeVisible(); // Overall completion from fixture
      await expect(page.locator('text=685 / 1,000')).toBeVisible(); // Components with comma formatting
    });
  });

  test.describe('Error Handling', () => {
    test('displays error state when API fails', async ({ page }) => {
      // Configure mock to return errors
      dashboardMockControls.simulateError('Database connection failed');
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Should show error alert
      await expect(page.locator('text=Unable to load dashboard metrics')).toBeVisible();
      await expect(page.locator('text=Please try refreshing the page')).toBeVisible();
    });

    test('shows loading state during slow API calls', async ({ page }) => {
      // Configure mock to simulate slow response
      dashboardMockControls.simulateSlowResponse(2000);
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Should show loading skeletons
      await expect(page.locator('.animate-pulse')).toBeVisible();
      
      // Eventually loads data
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible({ timeout: 5000 });
    });

    test('handles non-existent project gracefully', async ({ page }) => {
      await page.goto('/app/pipetrak/non-existent-project/dashboard');
      
      await expect(page.locator('text=Project not found or you don\'t have access to it')).toBeVisible();
    });
  });

  test.describe('Interactive Components', () => {
    test('area system grid cell click opens drill-down', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Click on a grid cell
      await page.locator('svg rect[class*="cursor-pointer"]').first().click();
      
      // Should open drill-down sheet
      await expect(page.locator('[data-testid="drill-down-sheet"]')).toBeVisible();
      
      // Should show drill-down content
      await expect(page.locator('text=Area-01 × System-01')).toBeVisible();
      await expect(page.locator('text=5 total components')).toBeVisible();
      await expect(page.locator('text=3 completed')).toBeVisible();
    });

    test('drawing hierarchy expand/collapse works', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Find and click expand button for parent drawing
      const parentDrawing = page.locator('text=DWG-001').locator('..')
        .locator('button[aria-label="Expand"]').first();
      
      await parentDrawing.click();
      
      // Should show child drawings
      await expect(page.locator('text=DWG-003')).toBeVisible(); // Child drawing from fixture
    });

    test('test package table sorting works', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Click completion percentage header to sort
      await page.locator('text=Completion %').click();
      
      // Should re-order packages by completion
      const firstPackage = page.locator('[data-testid="test-package-row"]').first();
      await expect(firstPackage.locator('text=100%')).toBeVisible(); // Highest completion first
    });

    test('activity feed user filtering works', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Click user filter dropdown
      await page.locator('[data-testid="activity-user-filter"]').click();
      
      // Select specific user
      await page.locator('text=John Smith').click();
      
      // Should filter activities to only show John Smith's actions
      const activities = page.locator('[data-testid="activity-item"]');
      await expect(activities).toContainText(['John Smith']);
      
      // Should not show other users
      await expect(activities).not.toContainText(['Jane Doe']);
    });
  });

  test.describe('Manual Refresh', () => {
    test('refresh button updates data', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Note the current timestamp
      const originalTimestamp = await page.locator('text=/Last updated:.*/')
        .textContent();
      
      // Wait a moment to ensure timestamp will be different
      await page.waitForTimeout(1000);
      
      // Click refresh button
      await page.locator('[data-testid="refresh-button"]').click();
      
      // Should show loading state briefly
      await expect(page.locator('.animate-pulse')).toBeVisible();
      
      // Should load fresh data with new timestamp
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      const newTimestamp = await page.locator('text=/Last updated:.*/')
        .textContent();
      
      expect(newTimestamp).not.toBe(originalTimestamp);
    });

    test('auto-refresh updates data periodically', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard?autoRefresh=true');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      const originalTimestamp = await page.locator('text=/Last updated:.*/')
        .textContent();
      
      // Wait for auto-refresh interval (assuming 30 seconds)
      await page.waitForTimeout(31000);
      
      const newTimestamp = await page.locator('text=/Last updated:.*/')
        .textContent();
      
      expect(newTimestamp).not.toBe(originalTimestamp);
    });
  });

  test.describe('Responsive Behavior', () => {
    test('switches to tablet layout on medium screen', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 900, height: 600 });
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Should show tablet layout
      await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
      
      // Should not show desktop-specific components
      await expect(page.locator('[data-testid="area-system-grid"]')).not.toBeVisible();
    });

    test('switches to mobile layout on small screen', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 400, height: 600 });
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Should show mobile layout
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      
      // Should show mobile-specific navigation
      await expect(page.locator('[data-testid="mobile-bottom-sheet"]')).toBeVisible();
    });

    test('adapts layout when resizing window', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Initially desktop
      await expect(page.locator('[data-testid="area-system-grid"]')).toBeVisible();
      
      // Resize to tablet
      await page.setViewportSize({ width: 800, height: 600 });
      
      // Should switch to tablet layout
      await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="area-system-grid"]')).not.toBeVisible();
      
      // Resize to mobile
      await page.setViewportSize({ width: 400, height: 600 });
      
      // Should switch to mobile layout
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Project Switching', () => {
    test('project selector works correctly', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Click project selector
      await page.locator('[data-testid="project-selector"]').click();
      
      // Select different project
      await page.locator('text=Large Test Project').click();
      
      // Should navigate to new project
      await expect(page).toHaveURL(/\/large-project\/dashboard/);
      
      // Should load new project data
      await expect(page.locator('text=Large Test Project Dashboard')).toBeVisible();
    });

    test('maintains layout when switching projects', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 900, height: 600 });
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
      
      // Switch project via URL
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Should maintain tablet layout
      await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Search and FileFiltering', () => {
    test('component search works across dashboard', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Use global search
      await page.locator('[data-testid="global-search"]').fill('VALVE-001');
      await page.keyboard.press('Enter');
      
      // Should highlight matching components
      await expect(page.locator('[data-testid="search-highlight"]')).toBeVisible();
      
      // Should filter activity feed to matching component
      await expect(page.locator('[data-testid="activity-item"]'))
        .toContainText(['VALVE-001']);
    });

    test('area/system filters work correctly', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Apply area filter
      await page.locator('[data-testid="area-filter"]').click();
      await page.locator('text=Area-01').click();
      
      // Should filter grid to show only Area-01 rows
      const visibleCells = page.locator('svg text').filter({ hasText: /Area-\d+/ });
      await expect(visibleCells).toContainText(['Area-01']);
      await expect(visibleCells).not.toContainText(['Area-02']);
    });
  });

  test.describe('Performance Monitoring', () => {
    test('tracks dashboard load performance', async ({ page }) => {
      // Enable performance monitoring
      const startTime = Date.now();
      
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Wait for Time to Interactive
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should meet performance budget
      expect(loadTime).toBeLessThan(3000); // 3 second budget
      
      // Log performance metrics for CI monitoring
      console.log(`Dashboard load time: ${loadTime}ms`);
    });

    test('measures component render performance', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Measure area system grid render time
      const startTime = await page.evaluate(() => performance.now());
      
      await expect(page.locator('[data-testid="area-system-grid"]')).toBeVisible();
      
      const endTime = await page.evaluate(() => performance.now());
      const renderTime = endTime - startTime;
      
      // Should render quickly even with large dataset
      expect(renderTime).toBeLessThan(1000); // 1 second budget
    });

    test('monitors memory usage during interactions', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Measure initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform multiple interactions
      for (let i = 0; i < 10; i++) {
        // Click various grid cells
        const cells = page.locator('svg rect[class*="cursor-pointer"]');
        const count = await cells.count();
        if (count > i) {
          await cells.nth(i).click();
          await page.keyboard.press('Escape'); // Close drill-down
        }
        
        // Wait between interactions
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      // Measure final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory should not grow excessively (allow for reasonable variance)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB increase limit
    });
  });

  test.describe('Accessibility', () => {
    test('dashboard is navigable with keyboard', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Project selector
      await page.keyboard.press('Tab'); // Refresh button
      await page.keyboard.press('Tab'); // First grid cell
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // Should open drill-down
      await expect(page.locator('[data-testid="drill-down-sheet"]')).toBeVisible();
      
      // Should be able to close with Escape
      await page.keyboard.press('Escape');
      
      await expect(page.locator('[data-testid="drill-down-sheet"]')).not.toBeVisible();
    });

    test('screen reader announcements work correctly', async ({ page }) => {
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible();
      
      // Check for ARIA labels and descriptions
      await expect(page.locator('[aria-label*="dashboard"]')).toBeVisible();
      await expect(page.locator('[aria-describedby]')).toHaveCount({ min: 1 });
      
      // Interactive elements should have proper roles
      await expect(page.locator('button')).toHaveAttribute('role', /button|menuitem/);
      
      // Status updates should be announced
      await page.locator('[data-testid="refresh-button"]').click();
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    });
  });
});