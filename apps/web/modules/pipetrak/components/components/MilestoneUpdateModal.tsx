"use client";

import { useState } from "react";
import { MilestoneUpdatePanel } from "./MilestoneUpdatePanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentWithMilestones, WorkflowType } from "../../types";

interface MilestoneUpdateModalProps {
  components: ComponentWithMilestones[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  isMobile?: boolean;
}

export function MilestoneUpdateModal({
  components,
  isOpen,
  onClose,
  onUpdate,
  isMobile = false,
}: MilestoneUpdateModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentComponent = components[currentIndex];

  if (!currentComponent) {
    return null;
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < components.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Get workflow type from component - it should already be set
  const workflowType = currentComponent.workflowType || "MILESTONE_DISCRETE" as WorkflowType;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent 
        className={isMobile ? "max-w-full h-full p-0" : "max-w-3xl max-h-[90vh]"}
      >
        <DialogHeader className={isMobile ? "p-4 pb-0" : ""}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Update Milestones</DialogTitle>
              <DialogDescription className="mt-1">
                Track progress for component milestones
              </DialogDescription>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation for multiple components */}
          {components.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentIndex + 1} of {components.length}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Components
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === components.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className={isMobile ? "h-[calc(100%-80px)] overflow-y-auto" : "max-h-[60vh] overflow-y-auto"}>
          <div className={isMobile ? "p-4" : "px-6 pb-6"}>
            <MilestoneUpdatePanel
              component={currentComponent}
              workflowType={workflowType}
              onUpdate={() => {
                if (onUpdate) onUpdate();
                
                // Auto-advance to next component if available
                if (currentIndex < components.length - 1) {
                  setTimeout(() => setCurrentIndex(currentIndex + 1), 500);
                } else {
                  // Close modal after last component
                  setTimeout(() => onClose(), 500);
                }
              }}
              touchTargetSize={isMobile ? 52 : 44}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}