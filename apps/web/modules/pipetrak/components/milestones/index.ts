// Core milestone rendering components
export { MilestoneDiscreteRenderer } from './core/MilestoneDiscreteRenderer';
export { MilestonePercentageRenderer } from './core/MilestonePercentageRenderer';
export { MilestoneQuantityRenderer } from './core/MilestoneQuantityRenderer';
export { MilestoneWorkflowRenderer } from './core/MilestoneWorkflowRenderer';

// State management and orchestration
export { MilestoneUpdateEngine, useMilestoneUpdateEngine, useMilestone, useComponentMilestones } from './core/MilestoneUpdateEngine';
export { OptimisticUpdateManager, type MilestoneUpdate, type OptimisticState, type UpdateCallback } from './core/OptimisticUpdateManager';

// Bulk update functionality
export { EnhancedBulkUpdateModal } from './bulk/EnhancedBulkUpdateModal';

// Table integration
export { TableMilestoneColumn } from './integration/TableMilestoneColumn';

// Mobile components
export { MobileMilestoneSheet } from './mobile/MobileMilestoneSheet';
export { TouchMilestoneCard } from './mobile/TouchMilestoneCard';
export { SwipeActions } from './mobile/SwipeActions';
export { OfflineIndicator } from './mobile/OfflineIndicator';

// Real-time functionality
export { RealtimeManager, useRealtime, usePresenceTracking } from './realtime/RealtimeManager';