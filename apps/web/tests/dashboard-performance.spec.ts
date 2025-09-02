/**
 * Dashboard Performance Tests
 * Tests load times, rendering performance, memory usage, and scalability
 */

import { test, expect, type Page } from '@playwright/test';
import { setupServer } from 'msw/node';
import { 
  dashboardHandlers, 
  dashboardMockControls 
} from '../modules/pipetrak/dashboard/__mocks__/dashboard-handlers';
import { 
  generateDashboardMetrics, 
} from '../modules/pipetrak/dashboard/__fixtures__/dashboard-data';

// Setup MSW server for controlled performance testing
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

// Performance measurement utilities
async function measurePageLoad(page: Page, url: string) {
  const startTime = Date.now();
  
  await page.goto(url);
  await page.waitForSelector('[data-testid="dashboard-loaded"]');
  
  const endTime = Date.now();
  
  // Get detailed performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    return {
      totalTime: Date.now() - performance.timeOrigin,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      networkTime: navigation.responseEnd - navigation.requestStart,
      renderingTime: navigation.loadEventEnd - navigation.responseEnd,
    };
  });
  
  return {
    wallClockTime: endTime - startTime,
    ...metrics
  };
}

async function measureMemoryUsage(page: Page) {
  return await page.evaluate(() => {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return null;
    
    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
    };
  });
}

async function measureRenderingTime(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const startTime = performance.now();
    const element = document.querySelector(sel);
    
    if (!element) return null;
    
    // Force reflow/repaint
    element.getBoundingClientRect();
    
    return performance.now() - startTime;
  }, selector);
}

test.describe('Dashboard Performance Tests', () => {
  test.describe('Load Time Performance', () => {
    test('small dataset loads under 2 seconds', async ({ page }) => {
      const metrics = await measurePageLoad(page, '/app/pipetrak/small-project/dashboard');
      
      // Performance assertions
      expect(metrics.wallClockTime).toBeLessThan(2000); // 2 second budget
      expect(metrics.firstPaint).toBeLessThan(1000); // 1 second to first paint
      expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds to FCP
      expect(metrics.domContentLoaded).toBeLessThan(1000); // 1 second to DOM ready
      
      console.log('Small dataset performance:', JSON.stringify(metrics, null, 2));
    });

    test('medium dataset loads under 3 seconds', async ({ page }) => {
      const metrics = await measurePageLoad(page, '/app/pipetrak/medium-project/dashboard');
      
      expect(metrics.wallClockTime).toBeLessThan(3000); // 3 second budget for medium
      expect(metrics.firstPaint).toBeLessThan(1500);
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
      
      console.log('Medium dataset performance:', JSON.stringify(metrics, null, 2));
    });

    test('large dataset loads under 5 seconds', async ({ page }) => {
      const metrics = await measurePageLoad(page, '/app/pipetrak/large-project/dashboard');
      
      expect(metrics.wallClockTime).toBeLessThan(5000); // 5 second budget for large
      expect(metrics.firstPaint).toBeLessThan(2000);
      expect(metrics.firstContentfulPaint).toBeLessThan(3000);
      
      console.log('Large dataset performance:', JSON.stringify(metrics, null, 2));
    });

    test('stress test with 10k components', async ({ page }) => {
      // Use mock data generator for stress test
      server.use(
        ...dashboardHandlers.map(handler => {
          if (handler.info?.path?.includes('get_dashboard_metrics')) {
            return {
              ...handler,
              resolver: () => {
                return new Response(JSON.stringify(generateDashboardMetrics(10000)));
              }
            };
          }
          return handler;
        })
      );
      
      const startTime = Date.now();
      await page.goto('/app/pipetrak/stress-test/dashboard');
      
      // Should eventually load even with 10k components
      await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Stress test budget: 10 seconds
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Stress test (10k components) load time: ${loadTime}ms`);
    });

    test('simulated slow network performance', async ({ page }) => {
      // Simulate slow network
      dashboardMockControls.simulateSlowResponse(3000);
      
      const startTime = Date.now();
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Should show loading states immediately
      await expect(page.locator('.animate-pulse')).toBeVisible();
      
      // Should eventually load
      await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should handle slow network gracefully
      expect(loadTime).toBeGreaterThan(3000); // Should respect slow network
      expect(loadTime).toBeLessThan(8000); // But not hang indefinitely
      
      console.log(`Slow network load time: ${loadTime}ms`);
    });
  });

  test.describe('Component Rendering Performance', () => {
    test('KPI hero bar renders quickly', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      const renderTime = await measureRenderingTime(page, '[data-testid="kpi-hero-bar"]');
      
      expect(renderTime).toBeLessThan(100); // 100ms budget
    });

    test('area system grid renders large datasets efficiently', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      const renderTime = await measureRenderingTime(page, '[data-testid="area-system-grid"]');
      
      expect(renderTime).toBeLessThan(500); // 500ms budget for complex SVG
      
      // Test interaction performance
      const startTime = Date.now();
      
      // Click on a grid cell
      const cell = page.locator('svg rect[class*="cursor-pointer"]').first();
      await cell.click();
      
      // Should open drill-down quickly
      await page.waitForSelector('[data-testid="drill-down-sheet"]');
      
      const interactionTime = Date.now() - startTime;
      expect(interactionTime).toBeLessThan(300); // 300ms for interaction response
    });

    test('drawing hierarchy expands without lag', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Measure time to expand first drawing
      const startTime = Date.now();
      
      const expandButton = page.locator('[data-testid="expand-drawing"]').first();
      await expandButton.click();
      
      await page.waitForSelector('[data-testid="child-drawing"]');
      
      const expandTime = Date.now() - startTime;
      expect(expandTime).toBeLessThan(200); // 200ms for tree expansion
    });

    test('test package table sorting performs well', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      // Measure sorting performance
      const startTime = Date.now();
      
      await page.locator('text="Completion %"').click();
      
      // Wait for sort to complete (visual change)
      await page.waitForTimeout(100);
      
      const sortTime = Date.now() - startTime;
      expect(sortTime).toBeLessThan(150); // 150ms for sorting
    });

    test('activity feed scrolling is smooth', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      const activityFeed = page.locator('[data-testid="activity-feed"]');
      
      // Measure scroll performance
      const scrollStartTime = Date.now();
      
      await activityFeed.evaluate((element) => {
        // Simulate smooth scrolling
        element.scrollTo({ top: 500, behavior: 'smooth' });
      });
      
      await page.waitForTimeout(500); // Wait for smooth scroll
      
      const scrollTime = Date.now() - scrollStartTime;
      
      // Should complete smooth scroll within reasonable time
      expect(scrollTime).toBeLessThan(1000);
    });
  });

  test.describe('Memory Usage Tests', () => {
    test('memory usage remains stable during normal usage', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      const initialMemory = await measureMemoryUsage(page);
      expect(initialMemory).toBeTruthy();
      
      // Perform various interactions
      const interactions = [
        () => page.locator('[data-testid="refresh-button"]').click(),
        () => page.locator('svg rect[class*="cursor-pointer"]').first().click(),
        () => page.keyboard.press('Escape'),
        () => page.locator('[data-testid="expand-drawing"]').first().click(),
        () => page.locator('text="Completion %"').click(),
      ];
      
      for (const interaction of interactions) {
        await interaction();
        await page.waitForTimeout(500); // Allow interaction to complete
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await measureMemoryUsage(page);
      
      // Memory should not grow excessively
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB increase limit
        
        console.log(`Memory usage - Initial: ${Math.round(initialMemory.usedJSHeapSize / 1024 / 1024)}MB, Final: ${Math.round(finalMemory.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    });

    test('no memory leaks during drill-down interactions', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      const initialMemory = await measureMemoryUsage(page);
      
      // Repeatedly open and close drill-downs
      const cells = page.locator('svg rect[class*="cursor-pointer"]');
      const cellCount = await cells.count();
      
      for (let i = 0; i < Math.min(10, cellCount); i++) {
        await cells.nth(i).click();
        await page.waitForSelector('[data-testid="drill-down-sheet"]');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await measureMemoryUsage(page);
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        
        // Should not leak memory with repeated interactions
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB increase limit
      }
    });
  });

  test.describe('Responsive Performance', () => {
    test('layout switching is fast', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      // Test desktop to tablet switch
      let startTime = Date.now();
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForSelector('[data-testid="tablet-dashboard"]');
      let switchTime = Date.now() - startTime;
      
      expect(switchTime).toBeLessThan(500); // 500ms for layout switch
      
      // Test tablet to mobile switch  
      startTime = Date.now();
      await page.setViewportSize({ width: 400, height: 600 });
      await page.waitForSelector('[data-testid="mobile-dashboard"]');
      switchTime = Date.now() - startTime;
      
      expect(switchTime).toBeLessThan(500);
      
      // Test mobile back to desktop
      startTime = Date.now();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForSelector('[data-testid="area-system-grid"]');
      switchTime = Date.now() - startTime;
      
      expect(switchTime).toBeLessThan(500);
    });

    test('mobile interactions are responsive', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      await page.goto('/app/pipetrak/small-project/dashboard');
      await page.waitForSelector('[data-testid="mobile-dashboard"]');
      
      // Test bottom sheet opening
      const startTime = Date.now();
      
      await page.locator('[data-testid="open-bottom-sheet"]').click();
      await page.waitForSelector('[data-testid="mobile-bottom-sheet"]');
      
      const openTime = Date.now() - startTime;
      expect(openTime).toBeLessThan(300); // 300ms for mobile interaction
    });
  });

  test.describe('Network Performance', () => {
    test('efficient API usage - minimal requests', async ({ page }) => {
      let requestCount = 0;
      
      // Count API requests
      page.on('request', (request) => {
        if (request.url().includes('/rpc/')) {
          requestCount++;
        }
      });
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      // Should make minimal API requests (one per RPC function)
      expect(requestCount).toBeLessThan(10); // Reasonable limit
      
      console.log(`Dashboard made ${requestCount} API requests`);
    });

    test('handles network errors gracefully without blocking UI', async ({ page }) => {
      let errorCount = 0;
      
      // Simulate intermittent network failures
      await page.route('**/rpc/get_area_system_matrix', (route) => {
        errorCount++;
        if (errorCount % 3 === 0) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      const startTime = Date.now();
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Should still load other components despite failures
      await page.waitForSelector('[data-testid="kpi-hero-bar"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should not be significantly slower due to retries
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Virtual Scrolling Performance', () => {
    test('component list virtual scrolling handles large datasets', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      await page.waitForSelector('[data-testid="mobile-dashboard"]');
      await page.locator('[data-testid="open-bottom-sheet"]').click();
      await page.waitForSelector('[data-testid="component-list"]');
      
      const componentList = page.locator('[data-testid="component-list"]');
      
      // Test scroll performance
      const startTime = Date.now();
      
      // Scroll through large list
      await componentList.evaluate((element) => {
        element.scrollTop = 2000; // Scroll down significantly
      });
      
      await page.waitForTimeout(100); // Allow rendering
      
      const scrollTime = Date.now() - startTime;
      
      // Virtual scrolling should be fast
      expect(scrollTime).toBeLessThan(200);
      
      // Should still show content after scroll
      await expect(page.locator('[data-testid="component-item"]')).toHaveCount({ min: 1 });
    });

    test('drawing hierarchy virtual scrolling performance', async ({ page }) => {
      await page.goto('/app/pipetrak/large-project/dashboard');
      
      const hierarchy = page.locator('[data-testid="drawing-hierarchy"]');
      
      // Test scrolling performance in hierarchy
      const startTime = Date.now();
      
      await hierarchy.evaluate((element) => {
        element.scrollTop = 1000;
      });
      
      await page.waitForTimeout(100);
      
      const scrollTime = Date.now() - startTime;
      expect(scrollTime).toBeLessThan(150);
    });
  });

  test.describe('Bundle Size and Loading Performance', () => {
    test('JavaScript bundle loads efficiently', async ({ page }) => {
      const totalBundleSize = 0;
      let jsRequestCount = 0;
      
      // Track JavaScript loading
      page.on('response', (response) => {
        if (response.url().includes('.js') && response.status() === 200) {
          jsRequestCount++;
          // Note: In a real test, you'd get content-length header
          // This is a simplified check
        }
      });
      
      await page.goto('/app/pipetrak/small-project/dashboard');
      await page.waitForSelector('[data-testid="dashboard-loaded"]');
      
      // Should not load excessive JS files
      expect(jsRequestCount).toBeLessThan(15);
      
      console.log(`Loaded ${jsRequestCount} JavaScript files`);
    });

    test('CSS loads without blocking rendering', async ({ page }) => {
      let cssLoadCount = 0;
      
      page.on('response', (response) => {
        if (response.url().includes('.css')) {
          cssLoadCount++;
        }
      });
      
      const startTime = Date.now();
      await page.goto('/app/pipetrak/small-project/dashboard');
      
      // Should see content before all CSS is loaded
      await page.waitForSelector('[data-testid="kpi-hero-bar"]');
      
      const renderTime = Date.now() - startTime;
      
      // Should render quickly even before all styles load
      expect(renderTime).toBeLessThan(1500);
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('maintains baseline performance metrics', async ({ page }) => {
      const metrics = await measurePageLoad(page, '/app/pipetrak/medium-project/dashboard');
      
      // These are baseline metrics that should be maintained
      const baselineMetrics = {
        wallClockTime: 3000,
        firstPaint: 1500,
        firstContentfulPaint: 2000,
        domContentLoaded: 1000,
      };
      
      // Check that we're within acceptable variance (10%) of baseline
      const tolerance = 0.1; // 10% tolerance
      
      Object.entries(baselineMetrics).forEach(([metric, baseline]) => {
        const actual = (metrics as any)[metric];
        const variance = Math.abs(actual - baseline) / baseline;
        
        expect(variance).toBeLessThan(tolerance);
        
        console.log(`${metric}: ${actual}ms (baseline: ${baseline}ms, variance: ${(variance * 100).toFixed(1)}%)`);
      });
    });

    test('performance degrades gracefully under load', async ({ page }) => {
      // Test with progressively larger datasets
      const datasets = ['small', 'medium', 'large'];
      const results: any[] = [];
      
      for (const dataset of datasets) {
        const metrics = await measurePageLoad(page, `/app/pipetrak/${dataset}-project/dashboard`);
        results.push({ dataset, ...metrics });
        
        // Clear between tests
        await page.goto('about:blank');
        await page.waitForTimeout(1000);
      }
      
      // Performance should degrade predictably, not catastrophically
      expect(results[1].wallClockTime).toBeLessThan(results[0].wallClockTime * 2);
      expect(results[2].wallClockTime).toBeLessThan(results[1].wallClockTime * 2);
      
      console.log('Performance scaling:', results);
    });
  });
});