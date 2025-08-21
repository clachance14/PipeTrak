import { test, expect, Page, BrowserContext } from '@playwright/test';
import { setupTestProject, cleanupTestProject, createTestUser } from './helpers/test-setup';

// Test data setup
const testProject = {
  id: 'test-project-milestones',
  name: 'Milestone Test Project',
  organizationId: 'test-org-milestones'
};

const testComponents = [
  {
    id: 'comp-discrete-1',
    componentId: 'VALVE-001',
    type: 'Ball Valve',
    workflowType: 'MILESTONE_DISCRETE',
    projectId: testProject.id
  },
  {
    id: 'comp-percentage-1', 
    componentId: 'PIPE-001',
    type: 'Steel Pipe',
    workflowType: 'MILESTONE_PERCENTAGE',
    projectId: testProject.id
  },
  {
    id: 'comp-quantity-1',
    componentId: 'BOLT-001', 
    type: 'Hex Bolt',
    workflowType: 'MILESTONE_QUANTITY',
    projectId: testProject.id
  }
];

test.describe('Milestone Workflow E2E Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let testUser: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Set up test data
    testUser = await createTestUser();
    await setupTestProject(testProject, testUser);
  });

  test.afterAll(async () => {
    await cleanupTestProject(testProject.id);
    await context.close();
  });

  test.beforeEach(async () => {
    // Navigate to project page
    await page.goto(`/app/${testProject.organizationId}/projects/${testProject.id}/components`);
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="component-table"]');
  });

  test.describe('Discrete Milestone Workflow', () => {
    test('should complete discrete milestone with checkbox', async () => {
      // Find the discrete component row
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      await expect(componentRow).toBeVisible();

      // Find milestone checkbox
      const milestoneCheckbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      await expect(milestoneCheckbox).toBeVisible();
      
      // Initially unchecked
      await expect(milestoneCheckbox).not.toBeChecked();

      // Click to complete milestone
      await milestoneCheckbox.click();

      // Should show as checked immediately (optimistic update)
      await expect(milestoneCheckbox).toBeChecked();

      // Should show success notification
      await expect(page.locator('.sonner-toast')).toContainText('updated successfully');

      // Verify persistence by refreshing
      await page.reload();
      await page.waitForSelector('[data-testid="component-table"]');
      
      const refreshedCheckbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      await expect(refreshedCheckbox).toBeChecked();
    });

    test('should handle discrete milestone toggle off', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const milestoneCheckbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();

      // First ensure it's checked
      if (!(await milestoneCheckbox.isChecked())) {
        await milestoneCheckbox.click();
        await expect(milestoneCheckbox).toBeChecked();
      }

      // Now uncheck it
      await milestoneCheckbox.click();
      await expect(milestoneCheckbox).not.toBeChecked();
    });

    test('should show loading state during update', async () => {
      // Mock slow network to see loading state
      await page.route('**/api/pipetrak/milestones/**', async route => {
        await page.waitForTimeout(1000); // 1 second delay
        await route.continue();
      });

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const milestoneCheckbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();

      await milestoneCheckbox.click();

      // Should show loading indicator
      await expect(componentRow.locator('[data-testid="milestone-loading"]')).toBeVisible();
      
      // Wait for completion
      await expect(componentRow.locator('[data-testid="milestone-loading"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Percentage Milestone Workflow', () => {
    test('should update percentage milestone with slider', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[1].componentId}"]`);
      await expect(componentRow).toBeVisible();

      // Open milestone details
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      // Wait for milestone panel to open
      await expect(page.locator('[data-testid="milestone-panel"]')).toBeVisible();

      // Find percentage slider
      const percentageSlider = page.locator('[data-testid="milestone-percentage-slider"]');
      await expect(percentageSlider).toBeVisible();

      // Get initial value
      const initialValue = await percentageSlider.getAttribute('value');
      expect(Number(initialValue)).toBeLessThan(100);

      // Set to 75%
      await percentageSlider.fill('75');
      await page.keyboard.press('Enter');

      // Should show updated value immediately
      await expect(page.locator('[data-testid="percentage-display"]')).toContainText('75%');

      // Should not be marked as complete (< 100%)
      await expect(page.locator('[data-testid="milestone-completed-indicator"]')).not.toBeVisible();
    });

    test('should mark percentage milestone complete at 100%', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[1].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      await expect(page.locator('[data-testid="milestone-panel"]')).toBeVisible();

      const percentageSlider = page.locator('[data-testid="milestone-percentage-slider"]');
      
      // Set to 100%
      await percentageSlider.fill('100');
      await page.keyboard.press('Enter');

      // Should show as completed
      await expect(page.locator('[data-testid="milestone-completed-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="percentage-display"]')).toContainText('100%');
    });

    test('should support percentage input field', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[1].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      const percentageInput = page.locator('[data-testid="milestone-percentage-input"]');
      
      // Clear and type new value
      await percentageInput.clear();
      await percentageInput.type('85');
      await page.keyboard.press('Enter');

      // Both input and slider should reflect new value
      await expect(percentageInput).toHaveValue('85');
      await expect(page.locator('[data-testid="milestone-percentage-slider"]')).toHaveValue('85');
    });

    test('should validate percentage bounds', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[1].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      const percentageInput = page.locator('[data-testid="milestone-percentage-input"]');
      
      // Try to enter value > 100
      await percentageInput.clear();
      await percentageInput.type('150');
      await page.keyboard.press('Enter');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('must be between 0 and 100');
      
      // Try negative value
      await percentageInput.clear();
      await percentageInput.type('-10');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="validation-error"]')).toContainText('must be between 0 and 100');
    });
  });

  test.describe('Quantity Milestone Workflow', () => {
    test('should update quantity milestone', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[2].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      await expect(page.locator('[data-testid="milestone-panel"]')).toBeVisible();

      const quantityInput = page.locator('[data-testid="milestone-quantity-input"]');
      const totalDisplay = page.locator('[data-testid="milestone-quantity-total"]');
      
      // Get total quantity
      const totalText = await totalDisplay.textContent();
      const totalQuantity = parseInt(totalText?.match(/\d+/)?.[0] || '10');

      // Set quantity to half of total
      const halfQuantity = Math.floor(totalQuantity / 2);
      await quantityInput.clear();
      await quantityInput.type(halfQuantity.toString());
      await page.keyboard.press('Enter');

      // Should show updated progress
      await expect(page.locator('[data-testid="quantity-progress"]')).toContainText(`${halfQuantity} / ${totalQuantity}`);

      // Should not be complete
      await expect(page.locator('[data-testid="milestone-completed-indicator"]')).not.toBeVisible();
    });

    test('should mark quantity milestone complete when quantity equals total', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[2].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      const quantityInput = page.locator('[data-testid="milestone-quantity-input"]');
      const totalDisplay = page.locator('[data-testid="milestone-quantity-total"]');
      
      const totalText = await totalDisplay.textContent();
      const totalQuantity = parseInt(totalText?.match(/\d+/)?.[0] || '10');

      // Set quantity to total
      await quantityInput.clear();
      await quantityInput.type(totalQuantity.toString());
      await page.keyboard.press('Enter');

      // Should show as completed
      await expect(page.locator('[data-testid="milestone-completed-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="quantity-progress"]')).toContainText(`${totalQuantity} / ${totalQuantity}`);
    });

    test('should validate quantity bounds', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[2].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();
      
      const quantityInput = page.locator('[data-testid="milestone-quantity-input"]');
      
      // Try negative quantity
      await quantityInput.clear();
      await quantityInput.type('-5');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="validation-error"]')).toContainText('cannot be negative');
    });
  });

  test.describe('Bulk Milestone Operations', () => {
    test('should select multiple components for bulk update', async () => {
      // Select first two components
      await page.locator(`[data-component-id="${testComponents[0].componentId}"] [data-testid="component-select"]`).click();
      await page.locator(`[data-component-id="${testComponents[1].componentId}"] [data-testid="component-select"]`).click();

      // Bulk action toolbar should appear
      await expect(page.locator('[data-testid="bulk-action-toolbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('2 components selected');

      // Click bulk update button
      await page.locator('[data-testid="bulk-update-button"]').click();

      // Bulk update modal should open
      await expect(page.locator('[data-testid="bulk-update-modal"]')).toBeVisible();
    });

    test('should preview bulk changes before applying', async () => {
      // Select components
      await page.locator(`[data-component-id="${testComponents[0].componentId}"] [data-testid="component-select"]`).click();
      await page.locator(`[data-component-id="${testComponents[1].componentId}"] [data-testid="component-select"]`).click();

      await page.locator('[data-testid="bulk-update-button"]').click();
      await expect(page.locator('[data-testid="bulk-update-modal"]')).toBeVisible();

      // Configure bulk update settings
      await page.locator('[data-testid="milestone-select"]').selectOption('Design Review');
      await page.locator('[data-testid="update-type-discrete"]').click();
      await page.locator('[data-testid="discrete-value-complete"]').click();

      // Click preview button
      await page.locator('[data-testid="preview-changes-button"]').click();

      // Preview should show
      await expect(page.locator('[data-testid="bulk-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-changes-count"]')).toContainText('2 changes');

      // Should show before/after values
      const previewItems = page.locator('[data-testid="preview-item"]');
      await expect(previewItems).toHaveCount(2);
    });

    test('should execute bulk update with progress tracking', async () => {
      // Select components
      await page.locator(`[data-component-id="${testComponents[0].componentId}"] [data-testid="component-select"]`).click();
      await page.locator(`[data-component-id="${testComponents[1].componentId}"] [data-testid="component-select"]`).click();

      await page.locator('[data-testid="bulk-update-button"]').click();

      // Configure and execute
      await page.locator('[data-testid="milestone-select"]').selectOption('Design Review');
      await page.locator('[data-testid="update-type-discrete"]').click();
      await page.locator('[data-testid="discrete-value-complete"]').click();

      // Execute bulk update
      await page.locator('[data-testid="execute-bulk-update"]').click();

      // Should show progress indicator
      await expect(page.locator('[data-testid="bulk-progress-bar"]')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="bulk-update-success"]')).toContainText('2 milestones updated');
    });

    test('should handle bulk update errors gracefully', async () => {
      // Mock API error for bulk update
      await page.route('**/api/pipetrak/milestones/bulk-update', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await page.locator(`[data-component-id="${testComponents[0].componentId}"] [data-testid="component-select"]`).click();
      await page.locator('[data-testid="bulk-update-button"]').click();

      await page.locator('[data-testid="milestone-select"]').selectOption('Design Review');
      await page.locator('[data-testid="update-type-discrete"]').click();
      await page.locator('[data-testid="execute-bulk-update"]').click();

      // Should show error message
      await expect(page.locator('[data-testid="bulk-update-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-update-error"]')).toContainText('Failed to update milestones');
    });

    test('should support undo bulk operations', async () => {
      // First perform a bulk update
      await page.locator(`[data-component-id="${testComponents[0].componentId}"] [data-testid="component-select"]`).click();
      await page.locator('[data-testid="bulk-update-button"]').click();

      await page.locator('[data-testid="milestone-select"]').selectOption('Design Review');
      await page.locator('[data-testid="update-type-discrete"]').click();
      await page.locator('[data-testid="discrete-value-complete"]').click();
      await page.locator('[data-testid="execute-bulk-update"]').click();

      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible();

      // Should show undo option
      await expect(page.locator('[data-testid="undo-bulk-update"]')).toBeVisible();
      
      // Click undo
      await page.locator('[data-testid="undo-bulk-update"]').click();

      // Should confirm undo
      await expect(page.locator('[data-testid="undo-confirmation"]')).toBeVisible();
      await page.locator('[data-testid="confirm-undo"]').click();

      // Should show undo success
      await expect(page.locator('[data-testid="undo-success"]')).toBeVisible();
    });
  });

  test.describe('Real-time Features', () => {
    test('should show other users editing the same component', async () => {
      // This test would require multiple browser contexts
      const secondContext = await page.context().browser()!.newContext();
      const secondPage = await secondContext.newPage();

      try {
        // Both users navigate to the same project
        await secondPage.goto(`/app/${testProject.organizationId}/projects/${testProject.id}/components`);
        
        // First user starts editing
        const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
        await componentRow.locator('[data-testid="milestone-details-button"]').click();

        // Second user should see presence indicator
        const secondUserComponentRow = secondPage.locator(`[data-component-id="${testComponents[0].componentId}"]`);
        await expect(secondUserComponentRow.locator('[data-testid="user-editing-indicator"]')).toBeVisible({ timeout: 5000 });

      } finally {
        await secondContext.close();
      }
    });

    test('should sync milestone updates across users', async () => {
      const secondContext = await page.context().browser()!.newContext();
      const secondPage = await secondContext.newPage();

      try {
        await secondPage.goto(`/app/${testProject.organizationId}/projects/${testProject.id}/components`);
        
        // First user updates milestone
        const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
        const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
        await checkbox.click();

        // Second user should see the update
        const secondUserComponentRow = secondPage.locator(`[data-component-id="${testComponents[0].componentId}"]`);
        const secondUserCheckbox = secondUserComponentRow.locator('[data-testid="milestone-checkbox"]').first();
        
        await expect(secondUserCheckbox).toBeChecked({ timeout: 5000 });

      } finally {
        await secondContext.close();
      }
    });

    test('should handle conflict resolution', async () => {
      // Mock conflict scenario
      await page.route('**/api/pipetrak/milestones/**', async (route, request) => {
        if (request.method() === 'PATCH') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({
              conflict: true,
              serverVersion: { isCompleted: true },
              clientVersion: { isCompleted: false }
            })
          });
        } else {
          await route.continue();
        }
      });

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      
      await checkbox.click();

      // Should show conflict dialog
      await expect(page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible();
      
      // Should show both versions
      await expect(page.locator('[data-testid="server-version"]')).toContainText('Completed');
      await expect(page.locator('[data-testid="client-version"]')).toContainText('Not Completed');

      // Choose to accept server version
      await page.locator('[data-testid="accept-server-version"]').click();

      // Dialog should close and milestone should reflect server state
      await expect(page.locator('[data-testid="conflict-resolution-dialog"]')).not.toBeVisible();
      await expect(checkbox).toBeChecked();
    });
  });

  test.describe('Offline Support', () => {
    test('should queue updates when offline', async () => {
      // Simulate going offline
      await page.context().setOffline(true);

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();

      await checkbox.click();

      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Should show queued update indicator
      await expect(page.locator('[data-testid="queued-updates-badge"]')).toContainText('1');

      // Optimistic update should still work
      await expect(checkbox).toBeChecked();
    });

    test('should sync queued updates when coming back online', async () => {
      // Start offline and make updates
      await page.context().setOffline(true);

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();

      await checkbox.click();
      await expect(page.locator('[data-testid="queued-updates-badge"]')).toContainText('1');

      // Come back online
      await page.context().setOffline(false);

      // Should show syncing indicator
      await expect(page.locator('[data-testid="syncing-indicator"]')).toBeVisible();

      // Should complete sync and clear queue
      await expect(page.locator('[data-testid="queued-updates-badge"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="sync-success-notification"]')).toBeVisible();
    });

    test('should handle offline sync errors', async () => {
      // Mock sync failure
      await page.route('**/api/pipetrak/milestones/sync', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Sync failed' })
        });
      });

      // Go offline and make updates
      await page.context().setOffline(true);
      
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      await checkbox.click();

      // Come back online
      await page.context().setOffline(false);

      // Should show sync error
      await expect(page.locator('[data-testid="sync-error-notification"]')).toBeVisible();
      
      // Updates should remain queued
      await expect(page.locator('[data-testid="queued-updates-badge"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show mobile-optimized milestone interface', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      await componentRow.locator('[data-testid="milestone-details-button"]').click();

      // Should show bottom sheet instead of modal
      await expect(page.locator('[data-testid="milestone-bottom-sheet"]')).toBeVisible();
      
      // Touch targets should be large enough (minimum 44px)
      const touchTargets = page.locator('[data-testid^="touch-target"]');
      const count = await touchTargets.count();
      
      for (let i = 0; i < count; i++) {
        const target = touchTargets.nth(i);
        const box = await target.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        expect(box?.width).toBeGreaterThanOrEqual(44);
      }
    });

    test('should support swipe gestures for milestone updates', async () => {
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      
      // Swipe right to mark complete
      await componentRow.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0); // Swipe right
      await page.mouse.up();

      // Should show swipe action completed
      await expect(page.locator('[data-testid="swipe-complete-action"]')).toBeVisible();
      
      // Milestone should be marked complete
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      await expect(checkbox).toBeChecked();
    });

    test('should handle mobile bulk selection', async () => {
      // Long press to enter selection mode
      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      
      await componentRow.hover();
      await page.mouse.down();
      await page.waitForTimeout(1000); // Long press
      await page.mouse.up();

      // Should enter selection mode
      await expect(page.locator('[data-testid="selection-mode-active"]')).toBeVisible();
      
      // Select additional components with tap
      await page.locator(`[data-component-id="${testComponents[1].componentId}"]`).click();
      
      // Should show mobile bulk action bar
      await expect(page.locator('[data-testid="mobile-bulk-action-bar"]')).toBeVisible();
    });
  });

  test.describe('Performance and Scale', () => {
    test('should handle large component lists efficiently', async () => {
      // Navigate to page with many components
      await page.goto(`/app/${testProject.organizationId}/projects/large-dataset/components`);
      
      // Should load within reasonable time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="component-table"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds

      // Virtual scrolling should work
      await page.locator('[data-testid="component-table"]').hover();
      await page.mouse.wheel(0, 5000); // Scroll down

      // Should load more items
      await expect(page.locator('[data-testid="virtualized-items"]')).toHaveCount(50, { timeout: 2000 });
    });

    test('should handle bulk operations on large datasets', async () => {
      await page.goto(`/app/${testProject.organizationId}/projects/large-dataset/components`);
      
      // Select all visible components
      await page.locator('[data-testid="select-all-checkbox"]').click();
      
      // Should show selection count
      await expect(page.locator('[data-testid="selected-count"]')).toContainText(/\d+ components selected/);
      
      // Bulk update should work efficiently
      await page.locator('[data-testid="bulk-update-button"]').click();
      await page.locator('[data-testid="milestone-select"]').selectOption('Design Review');
      await page.locator('[data-testid="update-type-discrete"]').click();
      
      const startTime = Date.now();
      await page.locator('[data-testid="execute-bulk-update"]').click();
      
      // Should complete within reasonable time
      await expect(page.locator('[data-testid="bulk-update-success"]')).toBeVisible({ timeout: 15000 });
      
      const updateTime = Date.now() - startTime;
      expect(updateTime).toBeLessThan(10000); // 10 seconds
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should recover from network errors', async () => {
      // Start with network failure
      await page.route('**/api/pipetrak/milestones/**', route => {
        route.abort();
      });

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      
      await checkbox.click();

      // Should show error state
      await expect(page.locator('[data-testid="update-error"]')).toBeVisible();
      
      // Clear network error
      await page.unroute('**/api/pipetrak/milestones/**');

      // Retry should work
      await page.locator('[data-testid="retry-update"]').click();
      
      // Should succeed
      await expect(page.locator('[data-testid="update-success"]')).toBeVisible();
      await expect(checkbox).toBeChecked();
    });

    test('should handle component not found errors', async () => {
      // Mock 404 response
      await page.route('**/api/pipetrak/milestones/**', route => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Milestone not found' })
        });
      });

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      
      await checkbox.click();

      // Should show specific error message
      await expect(page.locator('[data-testid="milestone-not-found-error"]')).toBeVisible();
      
      // Should revert optimistic update
      await expect(checkbox).not.toBeChecked();
    });

    test('should handle session expiration gracefully', async () => {
      // Mock 401 response
      await page.route('**/api/pipetrak/milestones/**', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });

      const componentRow = page.locator(`[data-component-id="${testComponents[0].componentId}"]`);
      const checkbox = componentRow.locator('[data-testid="milestone-checkbox"]').first();
      
      await checkbox.click();

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});