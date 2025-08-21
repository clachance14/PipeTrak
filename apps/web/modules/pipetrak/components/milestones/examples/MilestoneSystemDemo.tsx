"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { ComponentTable } from "../ComponentTable";
import { EnhancedBulkUpdateModal } from "../milestones/bulk/EnhancedBulkUpdateModal";
import { MobileMilestoneSheet } from "../milestones/mobile/MobileMilestoneSheet";
import { MilestoneUpdateEngine } from "../milestones/core/MilestoneUpdateEngine";
import { RealtimeManager } from "../milestones/realtime/RealtimeManager";
import { 
  Package,
  Target,
  Users,
  Smartphone,
  Monitor,
  Zap,
  CheckCircle
} from "lucide-react";
import type { ComponentWithMilestones } from "../../types";

interface MilestoneSystemDemoProps {
  projectId: string;
  userId: string;
  components: ComponentWithMilestones[];
  onComponentEdit?: (component: ComponentWithMilestones) => void;
}

export function MilestoneSystemDemo({
  projectId,
  userId,
  components,
  onComponentEdit
}: MilestoneSystemDemoProps) {
  const [selectedComponents, setSelectedComponents] = useState<ComponentWithMilestones[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentWithMilestones | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>();

  const handleComponentSelection = (componentIds: string[]) => {
    const selected = components.filter(c => componentIds.includes(c.id));
    setSelectedComponents(selected);
  };

  const handleBulkUpdate = async (updates: any) => {
    // Mock bulk update implementation
    console.log('Bulk updating milestones:', updates);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      successful: updates.updates?.length || 0,
      failed: 0,
      transactionId: `bulk_${Date.now()}`,
      results: updates.updates?.map((u: any) => ({
        componentId: u.componentId,
        milestoneName: u.milestoneName,
        success: true
      })) || []
    };
  };

  const handleBulkPreview = async (updates: any) => {
    // Mock preview implementation
    console.log('Previewing bulk updates:', updates);
    
    return {
      totalUpdates: updates.updates?.length || 0,
      validUpdates: updates.updates?.length || 0,
      invalidUpdates: 0,
      preview: updates.updates?.map((u: any) => ({
        componentId: u.componentId,
        milestoneName: u.milestoneName,
        currentValue: false,
        newValue: u.isCompleted || u.percentageValue || u.quantityValue,
        hasChanges: true
      })) || [],
      invalid: []
    };
  };

  const handleMilestoneClick = (component: ComponentWithMilestones, milestoneId?: string) => {
    setSelectedComponent(component);
    setSelectedMilestoneId(milestoneId);
    setShowMobileSheet(true);
  };

  const stats = {
    totalComponents: components.length,
    completedComponents: components.filter(c => c.completionPercent === 100).length,
    inProgressComponents: components.filter(c => c.completionPercent > 0 && c.completionPercent < 100).length,
    pendingComponents: components.filter(c => c.completionPercent === 0).length,
    totalMilestones: components.reduce((sum, c) => sum + (c.milestones?.length || 0), 0),
    completedMilestones: components.reduce((sum, c) => 
      sum + (c.milestones?.filter(m => m.isCompleted).length || 0), 0
    )
  };

  const overallProgress = stats.totalMilestones > 0 
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) 
    : 0;

  return (
    <RealtimeManager projectId={projectId} userId={userId}>
      <MilestoneUpdateEngine projectId={projectId}>
        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Milestone System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completedComponents}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgressComponents}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.pendingComponents}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                  <div className="text-sm text-muted-foreground">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Showcase */}
          <Tabs defaultValue="table" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop Table
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Interface
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Bulk Operations
                </TabsTrigger>
                <TabsTrigger value="realtime" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Real-time Features
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {components.length} Components
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {stats.totalMilestones} Milestones
                </Badge>
              </div>
            </div>

            <TabsContent value="table" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Component Table with Inline Milestone Editing</h3>
                <Button
                  onClick={() => setShowBulkModal(true)}
                  disabled={selectedComponents.length === 0}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Bulk Update ({selectedComponents.length})
                </Button>
              </div>

              <ComponentTable
                components={components}
                projectId={projectId}
                userId={userId}
                onEdit={onComponentEdit}
                onBulkEdit={handleComponentSelection}
                onMilestoneClick={handleMilestoneClick}
              />

              <div className="text-sm text-muted-foreground">
                • Click on milestone progress bars to edit inline
                • Select multiple components for bulk operations
                • Real-time updates from other users appear instantly
              </div>
            </TabsContent>

            <TabsContent value="mobile" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mobile-Optimized Interface</h3>
                <Button
                  onClick={() => {
                    setSelectedComponent(components[0]);
                    setShowMobileSheet(true);
                  }}
                  disabled={components.length === 0}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Open Mobile View
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {components.slice(0, 3).map(component => (
                  <Card key={component.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{component.componentId}</h4>
                        <Badge variant="outline" className="text-xs">
                          {component.milestones?.length || 0} milestones
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {component.description || "No description"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMilestoneClick(component)}
                        className="w-full"
                      >
                        View Milestones
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                • 52px+ touch targets optimized for industrial gloves
                • Swipe gestures for quick milestone completion
                • Offline-first with automatic sync when connectivity returns
                • Bottom sheet interface adapts to different screen sizes
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bulk Update Operations</h3>
                <Button
                  onClick={() => {
                    setSelectedComponents(components.slice(0, 3));
                    setShowBulkModal(true);
                  }}
                  disabled={components.length === 0}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Demo Bulk Update
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview & Validation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Preview changes before applying
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Validate permissions and data integrity
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Batch processing with progress indicators
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Error Handling</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Partial failure recovery
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Transaction rollback for critical errors
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Detailed success/failure reporting
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground">
                • Select multiple components to enable bulk operations
                • Configure different values for each milestone type (discrete, percentage, quantity)
                • Preview shows exactly which components and milestones will be affected
                • Operations are logged and can be undone if needed
              </div>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Real-time Collaboration</h3>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Connected
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Live Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        Instant milestone updates across all clients
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        Progress recalculation in real-time
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        Bulk operation notifications
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Collaboration Features</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        User presence indicators
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        Conflict detection and resolution
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        Edit notifications and coordination
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground">
                • Uses Supabase Realtime for instant synchronization
                • WebSocket connections with automatic reconnection
                • Optimistic updates provide immediate feedback
                • Conflict resolution preserves data integrity
              </div>
            </TabsContent>
          </Tabs>

          {/* Bulk Update Modal */}
          <EnhancedBulkUpdateModal
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            selectedComponents={selectedComponents}
            onBulkUpdate={handleBulkUpdate}
            onPreview={handleBulkPreview}
          />

          {/* Mobile Sheet */}
          {selectedComponent && (
            <MobileMilestoneSheet
              isOpen={showMobileSheet}
              onClose={() => setShowMobileSheet(false)}
              component={selectedComponent}
              selectedMilestoneId={selectedMilestoneId}
            />
          )}
        </div>
      </MilestoneUpdateEngine>
    </RealtimeManager>
  );
}