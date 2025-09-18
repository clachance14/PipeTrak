// Core milestone rendering components

// Bulk update functionality
export { EnhancedBulkUpdateModal } from "./bulk/EnhancedBulkUpdateModal";
export { MilestoneDiscreteRenderer } from "./core/MilestoneDiscreteRenderer";
export { MilestonePercentageRenderer } from "./core/MilestonePercentageRenderer";
export { MilestoneQuantityRenderer } from "./core/MilestoneQuantityRenderer";

// State management and orchestration
export {
	MilestoneUpdateEngine,
	useComponentMilestones,
	useMilestone,
	useMilestoneUpdateEngine,
} from "./core/MilestoneUpdateEngine";
export { MilestoneWorkflowRenderer } from "./core/MilestoneWorkflowRenderer";
export {
	type MilestoneUpdate,
	type OptimisticState,
	OptimisticUpdateManager,
	type UpdateCallback,
} from "./core/OptimisticUpdateManager";

// Table integration
export { TableMilestoneColumn } from "./integration/TableMilestoneColumn";

// Mobile components
export { MobileMilestoneSheet } from "./mobile/MobileMilestoneSheet";
export { OfflineIndicator } from "./mobile/OfflineIndicator";
export { TouchMilestoneCard } from "./mobile/TouchMilestoneCard";

// Real-time functionality
export {
	RealtimeManager,
	usePresenceTracking,
	useRealtime,
} from "./realtime/RealtimeManager";
