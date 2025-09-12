"use client";

import { X } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import type { ComponentWithMilestones } from "../../../types";

interface MobileMilestoneSheetProps {
  isOpen: boolean;
  onClose: () => void;
  component: ComponentWithMilestones;
  selectedMilestoneId?: string;
}

// Minimal mobile milestone sheet placeholder to satisfy usage in examples
export function MobileMilestoneSheet({
  isOpen,
  onClose,
  component,
  selectedMilestoneId,
}: MobileMilestoneSheetProps) {
  const selectedMilestone = component.milestones?.find(
    (m) => m.id === selectedMilestoneId,
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>
                {component.componentId}
                {selectedMilestone ? ` • ${selectedMilestone.milestoneName}` : ""}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </SheetHeader>

          <div className="p-4 text-sm text-muted-foreground">
            {/* Placeholder content; integrate real editor/viewer as needed */}
            <p>
              Mobile milestone sheet placeholder for {component.componentId}.
            </p>
            {selectedMilestone && (
              <p className="mt-2">
                Selected milestone: <strong>{selectedMilestone.milestoneName}</strong>
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileMilestoneSheet;

