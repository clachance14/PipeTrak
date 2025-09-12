"use client";

import { memo, useMemo } from "react";
import { MilestoneButton, type MilestoneButtonState } from "./MilestoneButton";
import type { ComponentMilestone, WorkflowType } from "../../../types";
import { cn } from "@ui/lib";

export interface MilestoneButtonRowProps {
  milestones: ComponentMilestone[];
  workflowType: WorkflowType;
  componentId: string;
  onMilestoneClick?: (milestoneId: string) => void;
  onMilestoneComplete?: (milestoneId: string) => void;
  onMilestoneUncomplete?: (milestoneId: string) => void;
  isLoading?: (milestoneId: string) => boolean;
  hasError?: (milestoneId: string) => boolean;
  className?: string;
}

/**
 * Determines if a milestone can be completed based on PipeTrak business rules
 */
function canCompleteMilestone(
  milestone: ComponentMilestone,
  milestones: ComponentMilestone[],
  workflowType: WorkflowType
): boolean {
  // Already completed milestones can be uncompleted
  if (milestone.isCompleted) {
    return true;
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const currentIndex = sortedMilestones.findIndex(m => m.id === milestone.id);
  
  if (currentIndex === -1) return false;

  const milestoneName = milestone.milestoneName.toUpperCase();
  
  // RECEIVE milestone can always be completed first
  if (milestoneName.includes("RECEIVE") || milestoneName.includes("REC")) {
    return true;
  }

  // Find RECEIVE milestone completion status
  const receiveMilestone = sortedMilestones.find(m => 
    m.milestoneName.toUpperCase().includes("RECEIVE") || 
    m.milestoneName.toUpperCase().includes("REC")
  );
  
  // For ERECT, CONNECT, SUPPORT - flexible after RECEIVE
  if (milestoneName.includes("ERECT") || milestoneName.includes("CONNECT") || milestoneName.includes("SUPPORT")) {
    return receiveMilestone ? receiveMilestone.isCompleted : false;
  }

  // Sequential milestones - must follow order
  if (milestoneName.includes("PUNCH")) {
    // PUNCH requires all previous milestones to be complete
    const previousMilestones = sortedMilestones.slice(0, currentIndex);
    return previousMilestones.every(m => m.isCompleted);
  }

  if (milestoneName.includes("TEST")) {
    // TEST requires PUNCH to be complete
    const punchMilestone = sortedMilestones.find(m => 
      m.milestoneName.toUpperCase().includes("PUNCH")
    );
    return punchMilestone ? punchMilestone.isCompleted : false;
  }

  if (milestoneName.includes("RESTORE")) {
    // RESTORE requires TEST to be complete
    const testMilestone = sortedMilestones.find(m => 
      m.milestoneName.toUpperCase().includes("TEST")
    );
    return testMilestone ? testMilestone.isCompleted : false;
  }

  // Field weld special cases
  if (milestoneName.includes("FIT")) {
    return receiveMilestone ? receiveMilestone.isCompleted : false;
  }

  if (milestoneName.includes("WELD")) {
    const fitMilestone = sortedMilestones.find(m => 
      m.milestoneName.toUpperCase().includes("FIT")
    );
    return fitMilestone ? fitMilestone.isCompleted : false;
  }

  if (milestoneName.includes("VT") || milestoneName.includes("VISUAL")) {
    const weldMilestone = sortedMilestones.find(m => 
      m.milestoneName.toUpperCase().includes("WELD")
    );
    return weldMilestone ? weldMilestone.isCompleted : false;
  }

  if (milestoneName.includes("RT") || milestoneName.includes("UT") || milestoneName.includes("RADIO") || milestoneName.includes("ULTRA")) {
    const vtMilestone = sortedMilestones.find(m => 
      m.milestoneName.toUpperCase().includes("VT") || 
      m.milestoneName.toUpperCase().includes("VISUAL")
    );
    return vtMilestone ? vtMilestone.isCompleted : false;
  }

  // Default: check if previous milestone is complete
  if (currentIndex > 0) {
    const previousMilestone = sortedMilestones[currentIndex - 1];
    return previousMilestone.isCompleted;
  }

  // First milestone can always be completed
  return true;
}

/**
 * Determines if a milestone can be uncompleted
 */
function canUncompleteMilestone(
  milestone: ComponentMilestone,
  milestones: ComponentMilestone[]
): boolean {
  if (!milestone.isCompleted) {
    return false;
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const currentIndex = sortedMilestones.findIndex(m => m.id === milestone.id);
  
  if (currentIndex === -1) return false;

  // Check if any subsequent milestones are completed
  const subsequentMilestones = sortedMilestones.slice(currentIndex + 1);
  const hasCompletedSubsequent = subsequentMilestones.some(m => m.isCompleted);
  
  // Cannot uncomplete if it would break dependencies
  return !hasCompletedSubsequent;
}

/**
 * Determines the state of a milestone button
 */
function getMilestoneButtonState(
  milestone: ComponentMilestone,
  milestones: ComponentMilestone[],
  workflowType: WorkflowType,
  isLoading: boolean,
  hasError: boolean
): MilestoneButtonState {
  if (isLoading) return "loading";
  if (hasError) return "error";
  if (milestone.isCompleted) return "complete";
  
  const canComplete = canCompleteMilestone(milestone, milestones, workflowType);
  
  if (!canComplete) {
    // Check if it's blocked by missing prerequisite
    const sortedMilestones = [...milestones].sort((a, b) => a.milestoneOrder - b.milestoneOrder);
    const currentIndex = sortedMilestones.findIndex(m => m.id === milestone.id);
    
    if (currentIndex > 0) {
      const previousMilestone = sortedMilestones[currentIndex - 1];
      if (!previousMilestone.isCompleted) {
        return "dependent";
      }
    }
    
    return "blocked";
  }
  
  return "available";
}

export const MilestoneButtonRow = memo(function MilestoneButtonRow({
  milestones,
  workflowType,
  componentId,
  onMilestoneClick,
  onMilestoneComplete,
  onMilestoneUncomplete,
  isLoading,
  hasError,
  className,
}: MilestoneButtonRowProps) {
  
  // Sort milestones by order and pad to exactly 7 buttons
  const sortedMilestones = useMemo(() => {
    const sorted = [...milestones].sort((a, b) => a.milestoneOrder - b.milestoneOrder);
    
    // Pad or truncate to exactly 7 milestones for consistent layout
    const paddedMilestones = [...sorted];
    
    while (paddedMilestones.length < 7) {
      paddedMilestones.push({
        id: `placeholder-${paddedMilestones.length}`,
        componentId,
        milestoneOrder: paddedMilestones.length + 1,
        milestoneName: "",
        isCompleted: false,
        percentageComplete: null,
        quantityComplete: null,
        quantityTotal: null,
        completedAt: null,
        completedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        weight: 0,
      });
    }
    
    return paddedMilestones.slice(0, 7);
  }, [milestones, componentId]);

  const handleMilestoneClick = (milestoneId: string) => {
    // Ignore placeholder milestones
    if (milestoneId.startsWith('placeholder-')) return;
    
    onMilestoneClick?.(milestoneId);
  };

  const handleMilestoneComplete = (milestoneId: string) => {
    // Ignore placeholder milestones
    if (milestoneId.startsWith('placeholder-')) return;
    
    onMilestoneComplete?.(milestoneId);
  };

  const handleMilestoneUncomplete = (milestoneId: string) => {
    // Ignore placeholder milestones
    if (milestoneId.startsWith('placeholder-')) return;
    
    onMilestoneUncomplete?.(milestoneId);
  };

  return (
    <div className={cn("flex gap-0.5 h-10", className)}>
      {sortedMilestones.map((milestone, index) => {
        const isPlaceholder = milestone.id.startsWith('placeholder-');
        
        if (isPlaceholder) {
          // Render empty placeholder button
          return (
            <div
              key={milestone.id}
              className="h-10 flex-1 min-w-[40px] bg-gray-50 border border-gray-100 rounded-md opacity-30"
            />
          );
        }

        const milestoneIsLoading = isLoading?.(milestone.id) || false;
        const milestoneHasError = hasError?.(milestone.id) || false;
        
        const state = getMilestoneButtonState(
          milestone,
          milestones,
          workflowType,
          milestoneIsLoading,
          milestoneHasError
        );

        return (
          <div key={milestone.id} className="flex-1 min-w-[40px]">
            <MilestoneButton
              milestone={milestone}
              state={state}
              onClick={onMilestoneClick ? handleMilestoneClick : undefined}
              onComplete={onMilestoneComplete ? handleMilestoneComplete : undefined}
              onUncomplete={onMilestoneUncomplete ? handleMilestoneUncomplete : undefined}
            />
          </div>
        );
      })}
    </div>
  );
});