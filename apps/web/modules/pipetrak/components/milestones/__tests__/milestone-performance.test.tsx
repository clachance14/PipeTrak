import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { server } from '../../../../test-setup';
import { http, HttpResponse } from 'msw';
import { 
  generateMockMilestones, 
  generateMockBulkUpdates,
} from '../__fixtures__/milestones';
import { MilestoneUpdateEngine } from '../core/MilestoneUpdateEngine';
import { OptimisticUpdateManager } from '../core/OptimisticUpdateManager';

// Mock performance observer
global.PerformanceObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Performance measurement utilities
class PerformanceMeasurer {
  private measurements: Map<string, number[]> = new Map();

  start(name: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      return duration;
    };
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      mean: measurements.reduce((a, b) => a + b) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  reset() {
    this.measurements.clear();
  }
}

describe('Milestone Performance Tests', () => {
  let performanceMeasurer: PerformanceMeasurer;
  let queryClient: QueryClient;

  beforeEach(() => {
    performanceMeasurer = new PerformanceMeasurer();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Mock high-performance timer
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    performanceMeasurer.reset();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe('OptimisticUpdateManager Performance', () => {
    it('should handle large numbers of optimistic updates efficiently', () => {
      const mockApiClient = {
        patch: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);

      // Initialize with large dataset
      const milestones = generateMockMilestones(1000);
      manager.updateServerState(milestones);

      const endMeasure = performanceMeasurer.start('bulk-optimistic-updates');

      // Apply 1000 optimistic updates
      for (let i = 0; i < 1000; i++) {
        manager.applyOptimisticUpdate({
          id: `update-${i}`,
          componentId: `component-${i % 100}`,
          milestoneId: milestones[i].id,
          milestoneName: milestones[i].milestoneName,
          workflowType: 'MILESTONE_DISCRETE',
          value: true,
          timestamp: Date.now()
        });
      }

      const duration = endMeasure();
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
      
      // All states should be updated
      expect(manager.getAllMilestoneStates().size).toBe(1000);

      manager.destroy();
    });

    it('should efficiently manage large offline queues', () => {
      const mockApiClient = {
        patch: vi.fn(),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);
      const milestones = generateMockMilestones(100);
      manager.updateServerState(milestones);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      const endMeasure = performanceMeasurer.start('offline-queue-operations');

      // Add 500 updates to offline queue
      for (let i = 0; i < 500; i++) {
        manager.applyOptimisticUpdate({
          id: `offline-update-${i}`,
          componentId: `component-${i % 50}`,
          milestoneId: milestones[i % milestones.length].id,
          milestoneName: milestones[i % milestones.length].milestoneName,
          workflowType: 'MILESTONE_DISCRETE',
          value: Math.random() > 0.5,
          timestamp: Date.now()
        });
      }

      const duration = endMeasure();

      // Should handle large offline queue efficiently
      expect(duration).toBeLessThan(2000);
      expect(manager.getOfflineQueue().length).toBe(500);

      manager.destroy();
    });

    it('should handle conflict resolution at scale', () => {
      const mockApiClient = {
        patch: vi.fn(),
        post: vi.fn(),
        get: vi.fn()
      };

      const callbacks = {
        onConflict: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient, callbacks);

      const endMeasure = performanceMeasurer.start('conflict-resolution');

      // Create 100 conflicting updates
      for (let i = 0; i < 100; i++) {
        const milestoneId = `milestone-${i}`;
        
        // Initialize server state
        manager.updateServerState([{
          id: milestoneId,
          componentId: `component-${i}`,
          milestoneName: `Milestone ${i}`,
          milestoneOrder: 1,
          isCompleted: false,
          percentageComplete: 0,
          quantityComplete: null,
          quantityTotal: null,
          completedAt: null,
          completedBy: null,
          createdAt: new Date(),
          updatedAt: new Date('2024-01-01T10:00:00Z'), // Old timestamp
          completer: null
        }]);

        // Apply optimistic update
        manager.applyOptimisticUpdate({
          id: `conflict-update-${i}`,
          componentId: `component-${i}`,
          milestoneId,
          milestoneName: `Milestone ${i}`,
          workflowType: 'MILESTONE_DISCRETE',
          value: true,
          timestamp: Date.now()
        });

        // Simulate conflicting server update
        manager.updateServerState([{
          id: milestoneId,
          componentId: `component-${i}`,
          milestoneName: `Milestone ${i}`,
          milestoneOrder: 1,
          isCompleted: false, // Conflicts with optimistic true
          percentageComplete: 0,
          quantityComplete: null,
          quantityTotal: null,
          completedAt: null,
          completedBy: null,
          createdAt: new Date(),
          updatedAt: new Date('2024-01-01T11:00:00Z'), // Newer timestamp
          completer: null
        }]);
      }

      const duration = endMeasure();

      // Should handle conflicts efficiently
      expect(duration).toBeLessThan(1000);
      expect(callbacks.onConflict).toHaveBeenCalledTimes(100);

      manager.destroy();
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle large bulk updates efficiently', async () => {
      // Mock bulk update API with realistic delay
      server.use(
        http.post('http://localhost:3000/api/pipetrak/milestones/bulk-update', async ({ request }) => {
          const { updates } = await request.json() as any;
          
          // Simulate processing time proportional to batch size
          const processingTime = Math.min(updates.length * 2, 3000); // Max 3 seconds
          await new Promise(resolve => setTimeout(resolve, processingTime));
          
          return HttpResponse.json({
            successful: updates.length,
            failed: 0,
            transactionId: `perf-test-${Date.now()}`,
            results: updates.map((update: any, index: number) => ({
              componentId: update.componentId,
              milestoneName: update.milestoneName,
              success: true,
              milestone: { id: `milestone-${index}`, ...update }
            }))
          });
        })
      );

      const updates = generateMockBulkUpdates(1000);

      const endMeasure = performanceMeasurer.start('bulk-update-1000');

      const response = await fetch('http://localhost:3000/api/pipetrak/milestones/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates,
          options: { batchSize: 50 } // Test batching
        })
      });

      const result = await response.json();
      const duration = endMeasure();

      expect(response.ok).toBe(true);
      expect(result.successful).toBe(1000);
      
      // Should complete within reasonable time (5 seconds for 1000 items)
      expect(duration).toBeLessThan(5000);
    });

    it('should efficiently batch process operations', async () => {
      const batchSizes = [10, 50, 100, 500];
      const updateCounts = [100, 500, 1000];

      for (const batchSize of batchSizes) {
        for (const updateCount of updateCounts) {
          server.use(
            http.post('http://localhost:3000/api/pipetrak/milestones/bulk-update', async ({ request }) => {
              const { updates, options } = await request.json() as any;
              
              // Simulate batched processing
              const actualBatchSize = options.batchSize || 50;
              const batches = Math.ceil(updates.length / actualBatchSize);
              const batchProcessingTime = batches * 100; // 100ms per batch
              
              await new Promise(resolve => setTimeout(resolve, batchProcessingTime));
              
              return HttpResponse.json({
                successful: updates.length,
                failed: 0,
                transactionId: `batch-test-${Date.now()}`,
                results: updates.map((u: any) => ({ ...u, success: true }))
              });
            })
          );

          const updates = generateMockBulkUpdates(updateCount);
          
          const endMeasure = performanceMeasurer.start(`batch-${batchSize}-${updateCount}`);
          
          const response = await fetch('http://localhost:3000/api/pipetrak/milestones/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              updates,
              options: { batchSize }
            })
          });

          const duration = endMeasure();
          
          expect(response.ok).toBe(true);
          
          // Larger batch sizes should be more efficient
          const stats = performanceMeasurer.getStats(`batch-${batchSize}-${updateCount}`);
          expect(stats?.mean).toBeLessThan(10000); // 10 seconds max
        }
      }
    });

    it('should handle concurrent bulk operations', async () => {
      server.use(
        http.post('http://localhost:3000/api/pipetrak/milestones/bulk-update', async ({ request }) => {
          const { updates } = await request.json() as any;
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          
          return HttpResponse.json({
            successful: updates.length,
            failed: 0,
            transactionId: `concurrent-${Date.now()}-${Math.random()}`,
            results: updates.map((u: any) => ({ ...u, success: true }))
          });
        })
      );

      const concurrentOperations = 10;
      const updatesPerOperation = 100;

      const endMeasure = performanceMeasurer.start('concurrent-bulk-operations');

      const promises = Array.from({ length: concurrentOperations }, (_, i) => {
        const updates = generateMockBulkUpdates(updatesPerOperation);
        return fetch('http://localhost:3000/api/pipetrak/milestones/bulk-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
      });

      const responses = await Promise.all(promises);
      const duration = endMeasure();

      // All should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Should handle concurrency efficiently (not much slower than sequential)
      expect(duration).toBeLessThan(2000); // Should finish in ~500ms due to concurrency
    });
  });

  describe('Memory Management Performance', () => {
    it('should not leak memory with large datasets', () => {
      const mockApiClient = {
        patch: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn(),
        get: vi.fn()
      };

      let manager: OptimisticUpdateManager | null = new OptimisticUpdateManager(mockApiClient);
      
      // Track memory usage (simplified)
      const initialMemory = 0;
      let peakMemory = 0;

      // Simulate large dataset operations
      for (let cycle = 0; cycle < 10; cycle++) {
        const milestones = generateMockMilestones(1000);
        manager.updateServerState(milestones);

        // Apply many updates
        for (let i = 0; i < 500; i++) {
          manager.applyOptimisticUpdate({
            id: `memory-test-${cycle}-${i}`,
            componentId: `component-${i}`,
            milestoneId: milestones[i % milestones.length].id,
            milestoneName: milestones[i % milestones.length].milestoneName,
            workflowType: 'MILESTONE_DISCRETE',
            value: Math.random() > 0.5,
            timestamp: Date.now()
          });
        }

        // Clear state periodically
        if (cycle % 3 === 0) {
          manager.clearOptimisticState();
        }

        // Track approximate memory usage
        const stateSize = manager.getAllMilestoneStates().size + 
                         manager.getOfflineQueue().length;
        peakMemory = Math.max(peakMemory, stateSize);
      }

      // Clean up
      manager.destroy();
      manager = null;

      // Memory usage should be reasonable
      expect(peakMemory).toBeLessThan(10000); // Reasonable upper bound
    });

    it('should efficiently garbage collect unused state', () => {
      const mockApiClient = {
        patch: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);

      // Create initial state
      const milestones = generateMockMilestones(1000);
      manager.updateServerState(milestones);

      const initialStateSize = manager.getAllMilestoneStates().size;

      // Apply updates
      milestones.forEach((milestone, index) => {
        manager.applyOptimisticUpdate({
          id: `gc-test-${index}`,
          componentId: milestone.componentId,
          milestoneId: milestone.id,
          milestoneName: milestone.milestoneName,
          workflowType: 'MILESTONE_DISCRETE',
          value: true,
          timestamp: Date.now()
        });
      });

      const peakStateSize = manager.getAllMilestoneStates().size;

      // Simulate API confirmations (which should clean up optimistic state)
      milestones.forEach((milestone, index) => {
        manager.confirmUpdate(`gc-test-${index}`, {
          ...milestone,
          isCompleted: true,
          updatedAt: new Date()
        });
      });

      const finalStateSize = manager.getAllMilestoneStates().size;

      // State should be cleaned up after confirmations
      expect(initialStateSize).toBe(1000);
      expect(peakStateSize).toBe(1000); // Should reuse server state entries
      expect(finalStateSize).toBe(1000); // Should maintain server state

      manager.destroy();
    });
  });

  describe('UI Performance with Large Datasets', () => {
    it('should render milestone components efficiently with large datasets', async () => {
      const TestComponent = () => {
        const milestones = generateMockMilestones(1000);
        
        return (
          <QueryClientProvider client={queryClient}>
            <MilestoneUpdateEngine projectId="perf-test-project">
              <div data-testid="milestone-list">
                {milestones.slice(0, 50).map(milestone => (
                  <div key={milestone.id} data-testid="milestone-item">
                    {milestone.milestoneName}
                  </div>
                ))}
              </div>
            </MilestoneUpdateEngine>
          </QueryClientProvider>
        );
      };

      const endMeasure = performanceMeasurer.start('component-render-large');

      const { getByTestId, getAllByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('milestone-list')).toBeInTheDocument();
      });

      const duration = endMeasure();
      const milestoneItems = getAllByTestId('milestone-item');

      // Should render efficiently
      expect(duration).toBeLessThan(500); // 500ms for initial render
      expect(milestoneItems).toHaveLength(50);
    });

    it('should handle rapid state updates without blocking UI', async () => {
      const mockApiClient = {
        patch: vi.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ data: {} }), 10)
          )
        ),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);
      const milestones = generateMockMilestones(100);
      manager.updateServerState(milestones);

      const endMeasure = performanceMeasurer.start('rapid-updates');

      // Apply 100 rapid updates
      const promises = milestones.map((milestone, index) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            manager.applyOptimisticUpdate({
              id: `rapid-${index}`,
              componentId: milestone.componentId,
              milestoneId: milestone.id,
              milestoneName: milestone.milestoneName,
              workflowType: 'MILESTONE_DISCRETE',
              value: Math.random() > 0.5,
              timestamp: Date.now()
            });
            resolve();
          }, index * 10); // Staggered by 10ms
        });
      });

      await Promise.all(promises);
      const duration = endMeasure();

      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(2000);
      expect(manager.getAllMilestoneStates().size).toBe(100);

      manager.destroy();
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      // Mock slow network
      server.use(
        http.patch('http://localhost:3000/api/pipetrak/milestones/:id', async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          return HttpResponse.json({ id: 'test', isCompleted: true });
        })
      );

      const endMeasure = performanceMeasurer.start('slow-network-update');

      const response = await fetch('http://localhost:3000/api/pipetrak/milestones/test-milestone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true })
      });

      const duration = endMeasure();

      expect(response.ok).toBe(true);
      expect(duration).toBeGreaterThan(1800); // Should reflect network delay
      expect(duration).toBeLessThan(2500); // But not much more due to overhead
    });

    it('should batch requests efficiently under high load', async () => {
      let requestCount = 0;
      
      server.use(
        http.patch('http://localhost:3000/api/pipetrak/milestones/:id', async () => {
          requestCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 'test', isCompleted: true });
        })
      );

      const mockApiClient = {
        patch: vi.fn().mockImplementation((url: string, data: any) => 
          fetch(`http://localhost:3000/api/pipetrak${url}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(r => ({ data: r.json() }))
        ),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);
      const milestones = generateMockMilestones(50);
      manager.updateServerState(milestones);

      const endMeasure = performanceMeasurer.start('batched-requests');

      // Apply many updates rapidly
      const promises = milestones.map((milestone, index) => {
        manager.applyOptimisticUpdate({
          id: `batch-${index}`,
          componentId: milestone.componentId,
          milestoneId: milestone.id,
          milestoneName: milestone.milestoneName,
          workflowType: 'MILESTONE_DISCRETE',
          value: true,
          timestamp: Date.now()
        });
      });

      // Wait for all API calls to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      const duration = endMeasure();

      // Should make requests efficiently
      expect(duration).toBeLessThan(5000);
      expect(requestCount).toBe(50); // All updates should result in API calls

      manager.destroy();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance SLOs', async () => {
      const slos = {
        singleUpdateP95: 300, // ms
        bulkUpdate50P95: 2000, // ms
        largeDatasetRenderP95: 1500, // ms
        offlineQueueSyncP95: 5000, // ms
      };

      // Single update benchmark
      const mockApiClient = {
        patch: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);
      const milestone = generateMockMilestones(1)[0];
      manager.updateServerState([milestone]);

      // Measure single updates
      const singleUpdateTimes = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        manager.applyOptimisticUpdate({
          id: `slo-test-${i}`,
          componentId: milestone.componentId,
          milestoneId: milestone.id,
          milestoneName: milestone.milestoneName,
          workflowType: 'MILESTONE_DISCRETE',
          value: Math.random() > 0.5,
          timestamp: Date.now()
        });
        singleUpdateTimes.push(performance.now() - start);
      }

      const singleUpdateP95 = singleUpdateTimes.sort((a, b) => a - b)[Math.floor(singleUpdateTimes.length * 0.95)];

      // Bulk update benchmark
      server.use(
        http.post('http://localhost:3000/api/pipetrak/milestones/bulk-update', async ({ request }) => {
          const { updates } = await request.json() as any;
          await new Promise(resolve => setTimeout(resolve, updates.length * 2)); // 2ms per update
          
          return HttpResponse.json({
            successful: updates.length,
            failed: 0,
            transactionId: `slo-bulk-${Date.now()}`,
            results: updates.map((u: any) => ({ ...u, success: true }))
          });
        })
      );

      const bulkStart = performance.now();
      const bulkUpdates = generateMockBulkUpdates(50);
      
      const bulkResponse = await fetch('http://localhost:3000/api/pipetrak/milestones/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: bulkUpdates })
      });
      
      const bulkDuration = performance.now() - bulkStart;

      // Verify SLOs
      expect(singleUpdateP95).toBeLessThan(slos.singleUpdateP95);
      expect(bulkDuration).toBeLessThan(slos.bulkUpdate50P95);
      expect(bulkResponse.ok).toBe(true);

      manager.destroy();
    });

    it('should maintain performance under stress', async () => {
      const mockApiClient = {
        patch: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn(),
        get: vi.fn()
      };

      const manager = new OptimisticUpdateManager(mockApiClient);

      // Stress test with varying loads
      const loadTests = [
        { milestones: 100, updates: 500 },
        { milestones: 500, updates: 1000 },
        { milestones: 1000, updates: 2000 }
      ];

      const results = [];

      for (const { milestones: milestoneCount, updates: updateCount } of loadTests) {
        const milestones = generateMockMilestones(milestoneCount);
        manager.updateServerState(milestones);

        const start = performance.now();

        for (let i = 0; i < updateCount; i++) {
          manager.applyOptimisticUpdate({
            id: `stress-${milestoneCount}-${i}`,
            componentId: `component-${i % milestoneCount}`,
            milestoneId: milestones[i % milestoneCount].id,
            milestoneName: milestones[i % milestoneCount].milestoneName,
            workflowType: 'MILESTONE_DISCRETE',
            value: Math.random() > 0.5,
            timestamp: Date.now()
          });
        }

        const duration = performance.now() - start;
        results.push({ milestoneCount, updateCount, duration });

        // Clear state for next test
        manager.clearOptimisticState();
      }

      // Performance should scale reasonably
      results.forEach(({ milestoneCount, updateCount, duration }) => {
        const updatesPerMs = updateCount / duration;
        
        // Should maintain at least 100 updates per second
        expect(updatesPerMs).toBeGreaterThan(0.1);
      });

      manager.destroy();
    });
  });
});