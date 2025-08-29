"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Alert, AlertDescription } from "@ui/components/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/components/accordion";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Package,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { ComponentWithMilestones } from "../../types";
import { FailureDetailsModal } from "./FailureDetailsModal";
import { 
  groupComponentsByTemplate, 
  validateBulkUpdate,
  type BulkUpdateSelections,
  type BulkUpdateResult
} from "../lib/bulk-update-utils";

interface BulkMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponents: ComponentWithMilestones[];
  projectId: string;
  onBulkUpdate: (updates: any) => Promise<BulkUpdateResult>;
}

type UpdateMode = "quick" | "advanced";

export function BulkMilestoneModal({
  isOpen,
  onClose,
  selectedComponents,
  projectId,
  onBulkUpdate
}: BulkMilestoneModalProps) {
  const [updateMode, setUpdateMode] = useState<UpdateMode>("quick");
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<BulkUpdateResult | null>(null);
  const [showFailureDetails, setShowFailureDetails] = useState(false);
  
  // Quick mode - single milestone for all types
  const [quickMilestone, setQuickMilestone] = useState<string>("");
  
  // Advanced mode - selections per group
  const [groupSelections, setGroupSelections] = useState<BulkUpdateSelections>({});

  // Group components by template
  const groups = useMemo(() => {
    return groupComponentsByTemplate(selectedComponents);
  }, [selectedComponents]);

  // Find common milestones across all groups
  const commonMilestones = useMemo(() => {
    if (groups.length === 0) return [];
    
    // Get all milestone names from first group
    let common = [...groups[0].availableMilestones];
    
    // Find intersection with all other groups
    for (let i = 1; i < groups.length; i++) {
      common = common.filter(milestone => 
        groups[i].availableMilestones.includes(milestone)
      );
    }
    
    return common;
  }, [groups]);

  // Reset state when modal opens/closes
  const resetState = () => {
    setUpdateMode("quick");
    setQuickMilestone("");
    setGroupSelections({});
    setIsUpdating(false);
    setProgress({ current: 0, total: 0 });
    setResult(null);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isUpdating) {
      resetState();
      onClose();
    }
  };

  // Toggle milestone selection for a group
  const toggleGroupMilestone = (templateId: string, milestoneName: string) => {
    setGroupSelections(prev => {
      const newSelections = { ...prev };
      if (!newSelections[templateId]) {
        newSelections[templateId] = new Set();
      }
      
      const milestoneSet = new Set(newSelections[templateId]);
      if (milestoneSet.has(milestoneName)) {
        milestoneSet.delete(milestoneName);
      } else {
        milestoneSet.add(milestoneName);
      }
      
      newSelections[templateId] = milestoneSet;
      return newSelections;
    });
  };

  // Handle bulk update execution
  const handleUpdate = async () => {
    setIsUpdating(true);
    setProgress({ current: 0, total: selectedComponents.length });

    try {
      let updates: any;
      
      if (updateMode === "quick" && quickMilestone) {
        // Quick mode - apply same milestone to all applicable components
        updates = {
          mode: "quick",
          projectId,
          milestoneName: quickMilestone,
          componentIds: selectedComponents.map(c => c.id)
        };
      } else if (updateMode === "advanced") {
        // Advanced mode - use group selections
        const validation = validateBulkUpdate(groups, groupSelections);
        if (!validation.valid) {
          toast.error(validation.errors[0] || "Invalid selection");
          setIsUpdating(false);
          return;
        }
        
        updates = {
          mode: "advanced",
          projectId,
          groups: groups.map(group => ({
            templateId: group.templateId,
            componentIds: group.components.map(c => c.id),
            milestones: Array.from(groupSelections[group.templateId] || [])
          })).filter(g => g.milestones.length > 0)
        };
      } else {
        toast.error("Please select milestones to update");
        setIsUpdating(false);
        return;
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + 1, prev.total - 1)
        }));
      }, 50);

      // Call the update function (this will be implemented in the parent)
      const result = await onBulkUpdate(updates);
      
      clearInterval(progressInterval);
      setProgress({ current: selectedComponents.length, total: selectedComponents.length });
      setResult(result);

      // Validate the result structure
      if (!result || typeof result !== 'object') {
        throw new Error("Invalid response from bulk update");
      }

      const { successful = [], failed = [], total = selectedComponents.length } = result;

      if (failed.length === 0) {
        toast.success(`Successfully updated ${successful.length} component${successful.length !== 1 ? 's' : ''}`);
        // Only auto-close on complete success
        setTimeout(() => handleClose(), 2000);
      } else if (successful.length === 0) {
        toast.error(`Failed to update all ${total} components`);
        // Don't auto-close on complete failure - let user see the error details
      } else {
        toast.warning(`Updated ${successful.length} of ${total} components. ${failed.length} failed.`);
        // Don't auto-close on partial failure - let user review failures
      }
      
    } catch (error) {
      // Clear the interval if it exists (will be undefined in the catch block context)
      const errorMessage = error instanceof Error ? error.message : "Failed to update components";
      toast.error(errorMessage);
      console.error("Bulk update error:", error);
      setResult(null); // Clear any partial results on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Bulk Update Milestones
          </DialogTitle>
          <DialogDescription>
            Update milestones for {selectedComponents.length} selected component
            {selectedComponents.length !== 1 ? 's' : ''}
            {groups.length > 1 && ` (${groups.length} different types)`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isUpdating ? (
            // Progress View
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Clock className="h-12 w-12 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium">Updating Components...</p>
                <p className="text-sm text-muted-foreground">
                  Processing {progress.current} of {progress.total} components
                </p>
              </div>
              <div className="w-full max-w-md">
                <Progress 
                  value={(progress.current / progress.total) * 100} 
                  className="h-3"
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {Math.round((progress.current / progress.total) * 100)}% complete
                </p>
              </div>
            </div>
          ) : result ? (
            // Results View
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Update Complete:</strong> {result.successful.length} of {selectedComponents.length} components updated successfully
                  {result.failed.length > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <strong className="text-orange-600">Warnings:</strong> {result.failed.length} components could not be updated
                      </div>
                      <Button
                        status="info"
                        size="sm"
                        onClick={() => setShowFailureDetails(true)}
                        className="ml-4"
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {result.failed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Failed Updates ({result.failed.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-1 text-sm">
                        {result.failed.map((failure, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground">{failure.componentId}</span>
                            <span className="text-red-600">{failure.error}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Configuration View
            <div className="space-y-6 overflow-auto">
              {/* Component Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Selected Components ({selectedComponents.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {groups.map(group => (
                    <Badge key={group.templateId} status="info">
                      {group.components.length} {group.type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Update Mode Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select 
                      value={updateMode} 
                      onValueChange={(value) => setUpdateMode(value as UpdateMode)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select update method" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonMilestones.length > 0 && (
                          <SelectItem value="quick">
                            Quick Update - All Types
                          </SelectItem>
                        )}
                        <SelectItem value="advanced">
                          Advanced - By Component Type
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {updateMode === "quick" && commonMilestones.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Quick Mode:</strong> Apply the same milestone to all component types. Only works for milestones that exist in all selected component types.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {updateMode === "advanced" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Advanced Mode:</strong> Choose different milestones for each component type. Gives you full control over what gets updated.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Mode Configuration */}
              {updateMode === "quick" && commonMilestones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common Milestone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Select value={quickMilestone} onValueChange={setQuickMilestone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select milestone to mark as complete" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonMilestones.map(milestone => (
                            <SelectItem key={milestone} value={milestone}>
                              Mark all as "{milestone}"
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {quickMilestone && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            This will mark "{quickMilestone}" as complete for all {selectedComponents.length} selected components.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Advanced Mode Configuration */}
              {updateMode === "advanced" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">By Component Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" defaultValue={groups.map(g => g.templateId)}>
                      {groups.map(group => (
                        <AccordionItem key={group.templateId} value={group.templateId}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <p className="font-medium">{group.type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group.components.length} components • {group.availableMilestones.length} milestones
                                </p>
                              </div>
                              {groupSelections[group.templateId]?.size > 0 && (
                                <Badge status="success">
                                  {groupSelections[group.templateId]?.size} selected
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-4">
                              {group.availableMilestones.map(milestone => {
                                const isSelected = groupSelections[group.templateId]?.has(milestone) || false;
                                return (
                                  <div 
                                    key={milestone}
                                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleGroupMilestone(group.templateId, milestone)}
                                    />
                                    <Label className="flex-1 cursor-pointer">
                                      Mark as "{milestone}"
                                    </Label>
                                    <Badge status="info" className="text-xs">
                                      {group.components.length} components
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Update Preview */}
              {((updateMode === "quick" && quickMilestone) || 
                (updateMode === "advanced" && Object.values(groupSelections).some(set => set.size > 0))) && (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Update Preview:</strong><br />
                    {updateMode === "quick" && quickMilestone
                      ? `Will mark "${quickMilestone}" as complete for all ${selectedComponents.length} components`
                      : updateMode === "advanced"
                      ? `Will update ${Object.values(groupSelections).reduce((sum, set) => sum + set.size, 0)} milestone(s) across ${Object.keys(groupSelections).filter(k => groupSelections[k].size > 0).length} component type(s)`
                      : ""
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {!isUpdating && !result && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={
                (updateMode === "quick" && !quickMilestone) ||
                (updateMode === "advanced" && Object.values(groupSelections).every(set => set.size === 0))
              }
            >
              Update Components
            </Button>
          </DialogFooter>
        )}

        {result && (
          <DialogFooter>
            <Button onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {/* Failure Details Modal */}
      {result && result.failed.length > 0 && (
        <FailureDetailsModal
          isOpen={showFailureDetails}
          onClose={() => setShowFailureDetails(false)}
          failures={result.failed}
          onRetry={async (failedItems) => {
            try {
              // Group failed items by milestone name to recreate the original update structure
              const retryUpdates: any = {
                projectId
              };

              if (updateMode === "quick" && quickMilestone) {
                // For quick mode, retry with the same milestone
                retryUpdates.mode = "quick";
                retryUpdates.milestoneName = quickMilestone;
                retryUpdates.componentIds = failedItems.map(f => f.componentId);
              } else if (updateMode === "advanced") {
                // For advanced mode, reconstruct the groups from failed items
                const retryGroups = new Map<string, { templateId: string; componentIds: string[]; milestones: string[]; }>();
                
                failedItems.forEach(failure => {
                  if (failure.milestoneName) {
                    // Find which group this component belonged to
                    const component = selectedComponents.find(c => c.id === failure.componentId);
                    if (component && component.milestoneTemplateId) {
                      const key = component.milestoneTemplateId;
                      if (!retryGroups.has(key)) {
                        retryGroups.set(key, {
                          templateId: component.milestoneTemplateId,
                          componentIds: [],
                          milestones: []
                        });
                      }
                      const group = retryGroups.get(key)!;
                      if (!group.componentIds.includes(failure.componentId)) {
                        group.componentIds.push(failure.componentId);
                      }
                      if (!group.milestones.includes(failure.milestoneName)) {
                        group.milestones.push(failure.milestoneName);
                      }
                    }
                  }
                });
                
                retryUpdates.mode = "advanced";
                retryUpdates.groups = Array.from(retryGroups.values());
              }

              // Use the same bulk update function
              return await onBulkUpdate(retryUpdates);
              
            } catch (error) {
              console.error("Retry failed:", error);
              // Return all items as failed if retry throws an error
              return {
                successful: [],
                failed: failedItems.map(item => ({
                  ...item,
                  error: error instanceof Error ? error.message : "Retry operation failed"
                })),
                total: failedItems.length
              };
            }
          }}
        />
      )}
    </Dialog>
  );
}