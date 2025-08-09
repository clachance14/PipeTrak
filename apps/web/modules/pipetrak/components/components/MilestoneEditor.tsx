"use client";

import { useState, useTransition } from "react";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Progress } from "@ui/components/progress";
import { Slider } from "@ui/components/slider";
import { Save, CheckCircle2 } from "lucide-react";
import { updateComponentMilestone } from "../lib/actions";
import type { Component, ComponentMilestone, WorkflowType } from "../../types";
import { toast } from "sonner";

interface MilestoneEditorProps {
  component: Component;
  milestones: ComponentMilestone[];
}

export function MilestoneEditor({ component, milestones }: MilestoneEditorProps) {
  const [editedMilestones, setEditedMilestones] = useState<Record<string, any>>({});
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const handleMilestoneChange = (milestoneId: string, field: string, value: any) => {
    setEditedMilestones(prev => ({
      ...prev,
      [milestoneId]: {
        ...prev[milestoneId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (Object.keys(editedMilestones).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    
    try {
      // Save all edited milestones
      const updates = Object.entries(editedMilestones).map(([milestoneId, changes]) => {
        const milestone = milestones.find(m => m.id === milestoneId);
        if (!milestone) return null;

        return updateComponentMilestone(
          component.id,
          milestone.id,
          changes
        );
      }).filter(Boolean);

      await Promise.all(updates);
      
      toast.success("Milestones updated successfully");
      setEditedMilestones({});
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error saving milestones:", error);
      toast.error("Failed to save milestones");
    } finally {
      setIsSaving(false);
    }
  };

  const renderMilestoneControl = (milestone: ComponentMilestone) => {
    const edited = editedMilestones[milestone.id] || {};
    
    switch (component.workflowType) {
      case 'MILESTONE_DISCRETE':
        const isCompleted = edited.isCompleted !== undefined ? edited.isCompleted : milestone.isCompleted;
        return (
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => 
                handleMilestoneChange(milestone.id, 'isCompleted', checked)
              }
              disabled={isSaving}
            />
            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
              {milestone.milestoneName}
            </span>
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
        );

      case 'MILESTONE_PERCENTAGE':
        const percentage = edited.percentageComplete !== undefined 
          ? edited.percentageComplete 
          : (milestone.percentageComplete || 0);
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>{milestone.milestoneName}</span>
              <span className="text-sm font-medium">{percentage}%</span>
            </div>
            <Slider
              value={[percentage]}
              onValueChange={(value) => 
                handleMilestoneChange(milestone.id, 'percentageComplete', value[0])
              }
              min={0}
              max={100}
              step={5}
              disabled={isSaving}
              className="w-full"
            />
            <Progress value={percentage} className="h-2" />
          </div>
        );

      case 'MILESTONE_QUANTITY':
        const quantityComplete = edited.quantityComplete !== undefined 
          ? edited.quantityComplete 
          : (milestone.quantityComplete || 0);
        const quantityTotal = milestone.quantityTotal || component.totalQuantity || 0;
        const quantityPercent = quantityTotal > 0 ? (quantityComplete / quantityTotal) * 100 : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>{milestone.milestoneName}</span>
              <span className="text-sm text-muted-foreground">
                {quantityComplete} / {quantityTotal}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={quantityComplete}
                onChange={(e) => 
                  handleMilestoneChange(milestone.id, 'quantityComplete', parseInt(e.target.value) || 0)
                }
                min={0}
                max={quantityTotal}
                disabled={isSaving}
                className="w-24"
              />
              <Progress value={quantityPercent} className="flex-1 h-2" />
              <span className="text-sm font-medium min-w-[3rem]">
                {Math.round(quantityPercent)}%
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const hasChanges = Object.keys(editedMilestones).length > 0;

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Milestones</h3>
          {hasChanges && (
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {milestones.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No milestones configured for this component
          </p>
        ) : (
          milestones.map((milestone) => (
            <div 
              key={milestone.id} 
              className={`p-3 rounded-lg ${
                editedMilestones[milestone.id] ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              {renderMilestoneControl(milestone)}
              {milestone.completedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <div className="flex items-center gap-3">
            <Progress value={component.completionPercent} className="w-32 h-2" />
            <span className="font-semibold">{Math.round(component.completionPercent)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}