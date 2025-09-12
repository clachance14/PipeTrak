"use client";

import { useState, useCallback, } from "react";
import { MilestoneUpdateEngine } from "../core/MilestoneUpdateEngine";
import { VirtualizedMobileComponentList } from "../../components/VirtualizedMobileComponentList";
import { useMilestonePerformanceOptimizer } from "./useMilestonePerformanceOptimizer";
import type { ComponentWithMilestones, } from "../../../types";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Clock, Wifi, WifiOff } from "lucide-react";

interface MobileMilestoneIntegrationExampleProps {
  projectId: string;
  initialComponents?: ComponentWithMilestones[];
  height?: number;
}

/**
 * Example implementation showing integration of the new mobile milestone UI
 * with existing PipeTrak systems and API endpoints
 */
export function MobileMilestoneIntegrationExample({
  projectId,
  initialComponents = [],
  height = 600,
}: MobileMilestoneIntegrationExampleProps) {
  const [components, setComponents] = useState<ComponentWithMilestones[]>(initialComponents);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);

  // Handle component updates from milestone engine
  const handleComponentUpdate = useCallback((
    componentId: string,
    updates: Partial<ComponentWithMilestones>
  ) => {
    setComponents(prev => prev.map(component => 
      component.id === componentId
        ? { ...component, ...updates }
        : component
    ));
  }, []);

  return (
    <MilestoneUpdateEngine
      projectId={projectId}
      components={components}
      onComponentUpdate={handleComponentUpdate}
    >
      <MobileMilestoneIntegrationContent
        components={components}
        selectedComponents={selectedComponents}
        setSelectedComponents={setSelectedComponents}
        height={height}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
      />
    </MilestoneUpdateEngine>
  );
}

interface MobileMilestoneIntegrationContentProps {
  components: ComponentWithMilestones[];
  selectedComponents: Set<string>;
  setSelectedComponents: (selected: Set<string>) => void;
  height: number;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

function MobileMilestoneIntegrationContent({
  components,
  selectedComponents,
  setSelectedComponents,
  height,
  isOnline,
  setIsOnline,
}: MobileMilestoneIntegrationContentProps) {
  const {
    batchedUpdateMilestone,
    immediateUpdateMilestone,
    flushBatch,
    clearBatch,
    batchStatus,
    engine,
  } = useMilestonePerformanceOptimizer({
    debounceMs: 300,
    maxBatchSize: 10,
    maxWaitMs: 2000,
  });

  // Handle component selection
  const handleComponentSelect = useCallback((componentId: string, selected: boolean) => {
    setSelectedComponents(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(componentId);
      } else {
        newSet.delete(componentId);
      }
      return newSet;
    });
  }, [setSelectedComponents]);

  // Handle component click (navigation)
  const handleComponentClick = useCallback((component: ComponentWithMilestones) => {
    console.log("Navigate to component:", component.componentId);
    // Implement navigation logic here
  }, []);

  // Handle milestone updates
  const handleMilestoneUpdate = useCallback((
    componentId: string,
    milestoneId: string,
    value: boolean | number
  ) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const milestone = component.milestones?.find(m => m.id === milestoneId);
    if (!milestone) return;

    // Use batched updates for better performance
    batchedUpdateMilestone(
      milestoneId,
      componentId,
      milestone.milestoneName,
      component.workflowType,
      value
    );
  }, [components, batchedUpdateMilestone]);

  // Handle quick status updates
  const handleQuickUpdate = useCallback((componentId: string, status: string) => {
    console.log("Quick update component:", componentId, "to status:", status);
    // Implement quick status update logic here
  }, []);

  // Handle opening milestone editor
  const handleOpenMilestones = useCallback((component: ComponentWithMilestones) => {
    console.log("Open milestone editor for:", component.componentId);
    // Implement milestone editor opening logic here
  }, []);

  // Handle opening quick selector
  const handleOpenQuickSelector = useCallback((component: ComponentWithMilestones) => {
    console.log("Open quick selector for:", component.componentId);
    // Implement quick selector opening logic here
  }, []);

  // Bulk operations for selected components
  const handleBulkComplete = useCallback(() => {
    selectedComponents.forEach(componentId => {
      const component = components.find(c => c.id === componentId);
      if (!component?.milestones) return;

      // Complete all available milestones
      component.milestones.forEach(milestone => {
        if (!milestone.isCompleted) {
          batchedUpdateMilestone(
            milestone.id,
            componentId,
            milestone.milestoneName,
            component.workflowType,
            true
          );
        }
      });
    });
  }, [selectedComponents, components, batchedUpdateMilestone]);

  // Simulate online/offline toggle for testing
  const toggleOnlineStatus = useCallback(() => {
    setIsOnline(prev => !prev);
  }, [setIsOnline]);

  // Force sync offline queue
  const handleSyncOffline = useCallback(async () => {
    try {
      await engine.syncOfflineQueue();
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }, [engine]);

  // Statistics
  const totalComponents = components.length;
  const selectedCount = selectedComponents.size;
  const completedComponents = components.filter(c => c.status === "COMPLETED").length;
  const inProgressComponents = components.filter(c => c.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Mobile Milestone UI</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleOnlineStatus}
                className="flex items-center gap-2"
              >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? "Online" : "Offline"}
              </Button>
              {!isOnline && engine.offlineQueueCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncOffline}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Sync ({engine.offlineQueueCount})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalComponents}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedComponents}</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inProgressComponents}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{selectedCount}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Batch Status */}
          {batchStatus.pendingCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {batchStatus.pendingCount} updates pending
                </span>
                {batchStatus.timeUntilFlush > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.ceil(batchStatus.timeUntilFlush / 1000)}s
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearBatch}>
                  Cancel
                </Button>
                <Button size="sm" onClick={flushBatch}>
                  Flush Now
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">
                {selectedCount} component{selectedCount > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedComponents(new Set())}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleBulkComplete}>
                  Complete All Milestones
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component List */}
      <Card>
        <CardContent className="p-0">
          <VirtualizedMobileComponentList
            components={components}
            selectedComponents={selectedComponents}
            onComponentSelect={handleComponentSelect}
            onComponentClick={handleComponentClick}
            onMilestoneUpdate={handleMilestoneUpdate}
            onQuickUpdate={handleQuickUpdate}
            onOpenMilestones={handleOpenMilestones}
            onOpenQuickSelector={handleOpenQuickSelector}
            height={height}
          />
        </CardContent>
      </Card>
    </div>
  );
}