"use client";

import { useState } from "react";
import { Layers, X } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib";
import type { DrawingTreeNode } from "../../types";
import { DrawingTreeView } from "./DrawingTreeView";
import { DrawingBreadcrumbsMobile } from "./DrawingBreadcrumbs";
import { ComponentCountBadge } from "./ComponentCountBadge";

interface DrawingMobileSheetProps {
  projectId: string;
  drawings: DrawingTreeNode[];
  selectedDrawingId?: string;
  onDrawingSelect: (drawingId: string) => void;
  isLoading?: boolean;
  triggerClassName?: string;
}

export function DrawingMobileSheet({
  projectId,
  drawings,
  selectedDrawingId,
  onDrawingSelect,
  isLoading = false,
  triggerClassName,
}: DrawingMobileSheetProps) {
  const [open, setOpen] = useState(false);

  const selectedDrawing = selectedDrawingId
    ? findDrawingById(drawings, selectedDrawingId)
    : null;

  const handleDrawingSelect = (drawingId: string) => {
    onDrawingSelect(drawingId);
    // Close sheet after selection
    setTimeout(() => setOpen(false), 100);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "fixed bottom-4 left-4 z-40 shadow-lg",
            "flex items-center gap-2",
            triggerClassName
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Drawings</span>
          {selectedDrawing && selectedDrawing.componentCount && (
            <ComponentCountBadge
              componentCount={selectedDrawing.componentCount}
              variant="compact"
            />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 rounded-t-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Drawing Navigation</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            {selectedDrawing && (
              <DrawingBreadcrumbsMobile
                projectId={projectId}
                drawing={selectedDrawing}
                className="mt-2"
              />
            )}
          </SheetHeader>

          {/* Tree View */}
          <DrawingTreeView
            drawings={drawings}
            selectedDrawingId={selectedDrawingId}
            onDrawingSelect={handleDrawingSelect}
            isMobile={true}
            isLoading={isLoading}
            className="flex-1 overflow-hidden"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper function to find a drawing by ID in the tree
function findDrawingById(
  drawings: DrawingTreeNode[],
  drawingId: string
): DrawingTreeNode | null {
  for (const drawing of drawings) {
    if (drawing.id === drawingId) {
      return drawing;
    }
    if (drawing.children && drawing.children.length > 0) {
      const found = findDrawingById(drawing.children, drawingId);
      if (found) return found;
    }
  }
  return null;
}

// Alternative floating action button style trigger
export function DrawingMobileFAB({
  projectId,
  drawings,
  selectedDrawingId,
  onDrawingSelect,
  isLoading = false,
}: DrawingMobileSheetProps) {
  const [open, setOpen] = useState(false);

  const handleDrawingSelect = (drawingId: string) => {
    onDrawingSelect(drawingId);
    setTimeout(() => setOpen(false), 100);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40",
          "h-14 w-14 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "flex items-center justify-center",
          "hover:bg-primary/90 transition-colors"
        )}
        aria-label="Open drawing navigation"
      >
        <Layers className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 rounded-t-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>Drawing Navigation</SheetTitle>
            </SheetHeader>
            <DrawingTreeView
              drawings={drawings}
              selectedDrawingId={selectedDrawingId}
              onDrawingSelect={handleDrawingSelect}
              isMobile={true}
              isLoading={isLoading}
              className="flex-1 overflow-hidden"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}