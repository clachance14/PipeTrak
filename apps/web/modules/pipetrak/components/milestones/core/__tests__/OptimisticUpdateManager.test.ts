import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptimisticUpdateManager, type MilestoneUpdate, type UpdateCallback } from '../OptimisticUpdateManager';
import { createMockMilestone, testScenarios } from '../../__fixtures__/milestones';
import type { ComponentMilestone, WorkflowType } from '../../../types';

// Mock API client
const createMockApiClient = () => ({
  patch: vi.fn(),
  post: vi.fn(),
  get: vi.fn()
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('OptimisticUpdateManager', () => {
  let manager: OptimisticUpdateManager;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let mockCallbacks: UpdateCallback;
  let mockMilestone: ComponentMilestone;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    mockCallbacks = {
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onConflict: vi.fn()
    };

    mockMilestone = createMockMilestone({
      id: 'test-milestone-1',
      componentId: 'test-component-1',
      milestoneName: 'Test Milestone',
      isCompleted: false,
      percentageComplete: 0,
      quantityComplete: 0,
      quantityTotal: 10
    });

    // Reset localStorage mocks
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Mock online state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    manager = new OptimisticUpdateManager(mockApiClient, mockCallbacks);
    manager.updateServerState([mockMilestone]);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Optimistic Updates', () => {
    it('should apply optimistic update immediately', () => {
      const update: MilestoneUpdate = {
        id: 'update-1',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      const result = manager.applyOptimisticUpdate(update);

      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).not.toBeNull();
      expect(manager.hasPendingUpdates(mockMilestone.id)).toBe(true);
      expect(manager.getOperationStatus(mockMilestone.id)).toBe('pending');
    });

    it('should apply percentage update optimistically', () => {
      const update: MilestoneUpdate = {
        id: 'update-2',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_PERCENTAGE',
        value: 75,
        timestamp: Date.now()
      };

      const result = manager.applyOptimisticUpdate(update);

      expect(result.percentageComplete).toBe(75);
      expect(result.isCompleted).toBe(false);
      expect(result.completedAt).toBeNull();
    });

    it('should apply quantity update optimistically', () => {
      const update: MilestoneUpdate = {
        id: 'update-3',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_QUANTITY',
        value: 7,
        timestamp: Date.now()
      };

      const result = manager.applyOptimisticUpdate(update);

      expect(result.quantityComplete).toBe(7);
      expect(result.isCompleted).toBe(false); // 7 < 10 total
      expect(result.completedAt).toBeNull();
    });

    it('should mark quantity milestone as completed when value equals total', () => {
      const update: MilestoneUpdate = {
        id: 'update-4',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_QUANTITY',
        value: 10, // equals quantityTotal
        timestamp: Date.now()
      };

      const result = manager.applyOptimisticUpdate(update);

      expect(result.quantityComplete).toBe(10);
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).not.toBeNull();
    });

    it('should mark percentage milestone as completed at 100%', () => {
      const update: MilestoneUpdate = {
        id: 'update-5',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_PERCENTAGE',
        value: 100,
        timestamp: Date.now()
      };

      const result = manager.applyOptimisticUpdate(update);

      expect(result.percentageComplete).toBe(100);
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).not.toBeNull();
    });
  });

  describe('API Integration', () => {
    it('should confirm successful update', async () => {
      const update: MilestoneUpdate = {
        id: 'update-6',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Mock successful API call
      mockApiClient.patch.mockResolvedValueOnce({
        data: { ...mockMilestone, isCompleted: true, completedAt: new Date() }
      });

      manager.applyOptimisticUpdate(update);
      
      // Wait for API call to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCallbacks.onSuccess).toHaveBeenCalledWith(
        update,
        expect.objectContaining({ isCompleted: true })
      );
      expect(manager.hasPendingUpdates(mockMilestone.id)).toBe(false);
      expect(manager.getOperationStatus(mockMilestone.id)).toBe('success');
    });

    it('should rollback failed update', async () => {
      const update: MilestoneUpdate = {
        id: 'update-7',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Mock failed API call
      const apiError = new Error('Network error');
      mockApiClient.patch.mockRejectedValueOnce(apiError);

      manager.applyOptimisticUpdate(update);
      
      // Wait for API call to fail
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCallbacks.onError).toHaveBeenCalledWith(update, apiError);
      expect(manager.getMilestoneState(mockMilestone.id)?.isCompleted).toBe(false);
      expect(manager.getOperationStatus(mockMilestone.id)).toBe('error');
    });

    it('should create correct API payload for different workflow types', async () => {
      const discreteUpdate: MilestoneUpdate = {
        id: 'discrete',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      mockApiClient.patch.mockResolvedValue({ data: mockMilestone });
      manager.applyOptimisticUpdate(discreteUpdate);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/milestones/${mockMilestone.id}`,
        { isCompleted: true }
      );

      vi.clearAllMocks();

      const percentageUpdate: MilestoneUpdate = {
        id: 'percentage',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_PERCENTAGE',
        value: 75,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(percentageUpdate);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/milestones/${mockMilestone.id}`,
        { percentageValue: 75 }
      );

      vi.clearAllMocks();

      const quantityUpdate: MilestoneUpdate = {
        id: 'quantity',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_QUANTITY',
        value: 5,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(quantityUpdate);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/milestones/${mockMilestone.id}`,
        { quantityValue: 5 }
      );
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts between local and remote states', () => {
      const { local, remote } = testScenarios.conflictedMilestone;
      
      const update: MilestoneUpdate = {
        id: 'conflict-test',
        componentId: local.componentId,
        milestoneId: local.id,
        milestoneName: local.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Apply optimistic update
      manager.applyOptimisticUpdate(update);
      
      // Simulate server state update with conflicting data
      manager.updateServerState([remote]);

      expect(mockCallbacks.onConflict).toHaveBeenCalledWith(
        expect.objectContaining({ milestoneId: local.id }),
        expect.objectContaining({
          local: expect.objectContaining({ isCompleted: true }),
          remote: expect.objectContaining({ isCompleted: false })
        })
      );
    });

    it('should not detect conflict when timestamps are compatible', () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const laterDate = new Date('2024-01-01T11:00:00Z');

      const local = {
        ...mockMilestone,
        isCompleted: true,
        updatedAt: laterDate
      };

      const remote = {
        ...mockMilestone,
        isCompleted: true,
        updatedAt: baseDate
      };

      const update: MilestoneUpdate = {
        id: 'no-conflict-test',
        componentId: local.componentId,
        milestoneId: local.id,
        milestoneName: local.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);
      manager.updateServerState([remote]);

      expect(mockCallbacks.onConflict).not.toHaveBeenCalled();
    });
  });

  describe('Offline Support', () => {
    it('should queue updates when offline', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const update: MilestoneUpdate = {
        id: 'offline-update',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);

      expect(manager.getOfflineQueue()).toHaveLength(1);
      expect(manager.getOfflineQueue()[0]).toEqual(update);
      expect(mockApiClient.patch).not.toHaveBeenCalled();
    });

    it('should persist offline queue to localStorage', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const update: MilestoneUpdate = {
        id: 'persist-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pipetrak_milestone_state',
        expect.stringContaining('offlineQueue')
      );
    });

    it('should restore offline queue from localStorage', () => {
      const persistedState = {
        offlineQueue: testScenarios.offlineQueue,
        rollbackQueue: []
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedState));

      const newManager = new OptimisticUpdateManager(mockApiClient, mockCallbacks);
      
      expect(newManager.getOfflineQueue()).toHaveLength(testScenarios.offlineQueue.length);
      
      newManager.destroy();
    });

    it('should process offline queue when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const update: MilestoneUpdate = {
        id: 'queue-process-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);
      expect(manager.getOfflineQueue()).toHaveLength(1);

      // Mock successful API response
      mockApiClient.patch.mockResolvedValue({
        data: { ...mockMilestone, isCompleted: true }
      });

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockApiClient.patch).toHaveBeenCalled();
      expect(manager.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations up to max retries', async () => {
      const update: MilestoneUpdate = {
        id: 'retry-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Mock API to fail twice, then succeed
      mockApiClient.patch
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          data: { ...mockMilestone, isCompleted: true }
        });

      manager.applyOptimisticUpdate(update);

      // Wait for initial failure and first retry
      await new Promise(resolve => setTimeout(resolve, 200));

      // Expect 3 attempts (initial + 2 retries)
      expect(mockApiClient.patch).toHaveBeenCalledTimes(3);
      expect(mockCallbacks.onSuccess).toHaveBeenCalled();
    });

    it('should stop retrying after max attempts', async () => {
      const update: MilestoneUpdate = {
        id: 'max-retry-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Mock API to always fail
      mockApiClient.patch.mockRejectedValue(new Error('Persistent error'));

      manager.applyOptimisticUpdate(update);

      // Wait for all retry attempts
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should have tried 3 times (initial + 2 retries)
      expect(mockApiClient.patch).toHaveBeenCalledTimes(3);
      expect(manager.hasPendingUpdates(mockMilestone.id)).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return optimistic state over server state', () => {
      const update: MilestoneUpdate = {
        id: 'state-priority-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);

      const currentState = manager.getMilestoneState(mockMilestone.id);
      expect(currentState?.isCompleted).toBe(true); // Optimistic state
      expect(manager.getAllMilestoneStates().get(mockMilestone.id)?.isCompleted).toBe(true);
    });

    it('should clear all optimistic state', () => {
      const update: MilestoneUpdate = {
        id: 'clear-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);
      expect(manager.hasPendingUpdates(mockMilestone.id)).toBe(true);

      manager.clearOptimisticState();
      
      expect(manager.hasPendingUpdates(mockMilestone.id)).toBe(false);
      expect(manager.getMilestoneState(mockMilestone.id)?.isCompleted).toBe(false); // Back to server state
    });

    it('should clear offline queue after successful sync', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const update: MilestoneUpdate = {
        id: 'queue-clear-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      manager.applyOptimisticUpdate(update);
      expect(manager.getOfflineQueue()).toHaveLength(1);

      manager.clearOfflineQueue();
      expect(manager.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown workflow types gracefully', () => {
      const update: MilestoneUpdate = {
        id: 'unknown-workflow',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'UNKNOWN_TYPE' as WorkflowType,
        value: true,
        timestamp: Date.now()
      };

      expect(() => manager.applyOptimisticUpdate(update)).toThrow();
    });

    it('should handle missing milestone gracefully', () => {
      const update: MilestoneUpdate = {
        id: 'missing-milestone',
        componentId: 'nonexistent',
        milestoneId: 'nonexistent',
        milestoneName: 'Nonexistent',
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      expect(() => manager.applyOptimisticUpdate(update)).toThrow('Milestone nonexistent not found');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const update: MilestoneUpdate = {
        id: 'storage-error-test',
        componentId: mockMilestone.componentId,
        milestoneId: mockMilestone.id,
        milestoneName: mockMilestone.milestoneName,
        workflowType: 'MILESTONE_DISCRETE',
        value: true,
        timestamp: Date.now()
      };

      // Should not throw despite localStorage error
      expect(() => manager.applyOptimisticUpdate(update)).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      manager.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});