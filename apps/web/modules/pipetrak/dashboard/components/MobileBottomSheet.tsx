'use client';

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import { Progress } from "@ui/components/progress";
import { ScrollArea } from "@ui/components/scroll-area";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  FileText,
  User,
  Calendar,
  Triangle,
  Edit,
  History
} from "lucide-react";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface MobileBottomSheetProps {
  component: ComponentWithMilestones | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneToggle?: (componentId: string, milestoneId: string, completed: boolean) => void;
  onEdit?: (component: ComponentWithMilestones) => void;
  onViewHistory?: (component: ComponentWithMilestones) => void;
}

/**
 * Mobile Bottom Sheet - Component detail view with large touch targets
 * Optimized for mobile interaction with swipe gestures and accessibility
 */
export function MobileBottomSheet({
  component,
  open,
  onOpenChange,
  onMilestoneToggle,
  onEdit,
  onViewHistory
}: MobileBottomSheetProps) {
  const [updatingMilestones, setUpdatingMilestones] = useState<Set<string>>(new Set());

  if (!component) return null;

  const completedMilestones = component.milestones?.filter(m => m.isCompleted).length || 0;
  const totalMilestones = component.milestones?.length || 0;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Check if component is stalled
  const isStalled = component.updatedAt ? 
    Math.floor((Date.now() - new Date(component.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) >= 7 : 
    false;

  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    if (!onMilestoneToggle) return;
    
    setUpdatingMilestones(prev => new Set(prev).add(milestoneId));
    
    try {
      await onMilestoneToggle(component.id, milestoneId, completed);
    } finally {
      setUpdatingMilestones(prev => {
        const updated = new Set(prev);
        updated.delete(milestoneId);
        return updated;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] flex flex-col"
        onInteractOutside={() => onOpenChange(false)}
      >
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="flex items-center gap-2">
                <span className="truncate">{component.componentId}</span>
                {isStalled && (
                  <Triangle className="h-4 w-4 text-orange-500 fill-orange-100 shrink-0" />
                )}
              </SheetTitle>
              
              {component.description && (
                <SheetDescription className="mt-1">
                  {component.description}
                </SheetDescription>
              )}

              {/* Component metadata */}
              <div className="flex flex-wrap gap-2 mt-2">
                {component.area && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {component.area}
                  </Badge>
                )}
                {component.system && (
                  <Badge variant="outline">
                    {component.system}
                  </Badge>
                )}
                {component.drawingNumber && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {component.drawingNumber}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(component)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Progress Overview */}
        <div className="py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className={cn(
              "text-lg font-bold",
              progressPercent === 100 ? "text-green-600" : "text-primary"
            )}>
              {progressPercent}%
            </span>
          </div>
          
          <Progress value={progressPercent} className="h-2 mb-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedMilestones} of {totalMilestones} milestones completed</span>
            {component.updatedAt && (
              <span>
                Last updated {new Date(component.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Milestone List */}
        <div className="flex-1 overflow-hidden">
          <div className="py-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Milestones ({totalMilestones})
            </h3>

            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {component.milestones && component.milestones.length > 0 ? (
                  component.milestones
                    .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                    .map((milestone) => (
                      <MilestoneItem
                        key={milestone.id}
                        milestone={milestone}
                        isUpdating={updatingMilestones.has(milestone.id)}
                        onToggle={(completed) => handleMilestoneToggle(milestone.id, completed)}
                      />
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Circle className="h-8 w-8 mx-auto mb-2" />
                    <p>No milestones defined</p>
                    <p className="text-sm">Contact your project manager to set up milestones</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 h-12"
              onClick={() => onViewHistory?.(component)}
            >
              <History className="h-4 w-4" />
              View History
            </Button>
            
            <Button
              className="flex-1 gap-2 h-12"
              disabled={progressPercent === 100}
            >
              <CheckCircle2 className="h-4 w-4" />
              {progressPercent === 100 ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface MilestoneItemProps {
  milestone: any; // ComponentMilestone type
  isUpdating: boolean;
  onToggle: (completed: boolean) => void;
}

function MilestoneItem({ milestone, isUpdating, onToggle }: MilestoneItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 bg-gray-50 rounded-lg border transition-all",
        "min-h-[64px]", // Minimum touch target size
        isUpdating && "opacity-50 pointer-events-none"
      )}
    >
      {/* Toggle Switch - Large touch target */}
      <div className="shrink-0">
        <Switch
          checked={milestone.isCompleted}
          onCheckedChange={onToggle}
          disabled={isUpdating}
          className="scale-110" // Slightly larger for better touch
        />
      </div>

      {/* Milestone content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm",
              milestone.isCompleted && "line-through text-muted-foreground"
            )}>
              {milestone.milestoneName}
            </h4>
            
            {/* Progress details */}
            {(milestone.percentageComplete !== null || milestone.quantityComplete !== null) && (
              <div className="mt-1 text-xs text-muted-foreground">
                {milestone.percentageComplete !== null && (
                  <span>{milestone.percentageComplete}% complete</span>
                )}
                {milestone.quantityComplete !== null && milestone.quantityTotal && (
                  <span>
                    {milestone.quantityComplete}/{milestone.quantityTotal} units
                  </span>
                )}
              </div>
            )}

            {/* Completion info */}
            {milestone.isCompleted && milestone.completedAt && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  Completed {new Date(milestone.completedAt).toLocaleDateString()}
                </span>
                {milestone.completedBy && (
                  <>
                    <span>by</span>
                    <span className="font-medium">{milestone.completedBy}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status icon */}
          <div className="shrink-0 ml-2">
            {milestone.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}