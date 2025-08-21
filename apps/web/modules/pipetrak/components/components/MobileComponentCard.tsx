"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { 
  ChevronRight, 
  MapPin, 
  Package, 
  Wrench,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit2,
  CheckSquare,
  Copy,
  Trash2,
  Target,
  ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import type { ComponentWithMilestones } from "../../types";

interface MobileComponentCardProps {
  component: ComponentWithMilestones;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onQuickUpdate?: (status: string) => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenMilestones?: () => void;
}

export function MobileComponentCard({ 
  component, 
  isSelected,
  onSelect,
  onClick, 
  onQuickUpdate,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenMilestones
}: MobileComponentCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Calculate milestone statistics
  const milestoneStats = useMemo(() => {
    if (!component.milestones || component.milestones.length === 0) {
      return { total: 0, completed: 0, current: null, nextPending: null };
    }
    
    const total = component.milestones.length;
    const completed = component.milestones.filter(m => m.isCompleted).length;
    
    // Find current milestone (first incomplete)
    const current = component.milestones.find(m => !m.isCompleted);
    
    // Find next pending milestone
    const currentIndex = current ? component.milestones.indexOf(current) : -1;
    const nextPending = currentIndex >= 0 && currentIndex < total - 1 
      ? component.milestones[currentIndex + 1] 
      : null;
    
    return { total, completed, current, nextPending };
  }, [component.milestones]);

  const getStatusIcon = () => {
    switch (component.status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-fieldComplete" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-fieldPending" />;
    }
  };

  const getStatusColor = () => {
    switch (component.status) {
      case "COMPLETED":
        return "bg-fieldComplete/10 text-fieldComplete border-fieldComplete/20";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-fieldPending/10 text-fieldPending border-fieldPending/20";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };
  
  const getMilestoneVariant = (milestone: any) => {
    if (!milestone) return "outline";
    if (milestone.isCompleted) return "default";
    const percent = milestone.percentageComplete || milestone.quantityCompleted || 0;
    if (percent > 0) return "secondary";
    return "outline";
  };
  
  const getMilestoneProgress = () => {
    if (!milestoneStats.current) return 100; // All complete
    
    // For current milestone, check workflow type
    if (component.workflowType === "MILESTONE_PERCENTAGE") {
      return milestoneStats.current.percentageComplete || 0;
    } else if (component.workflowType === "MILESTONE_QUANTITY") {
      const total = milestoneStats.current.quantityRequired || 1;
      const completed = milestoneStats.current.quantityCompleted || 0;
      return Math.round((completed / total) * 100);
    } else {
      // Discrete: either 0 or 100
      return milestoneStats.current.isCompleted ? 100 : 0;
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
    const diff = currentX - startX;
    
    // Start dragging if moved more than 10px
    if (Math.abs(diff) > 10 && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    const diff = currentX - startX;
    
    // Swipe right to select/deselect (threshold: 100px)
    if (diff > 100) {
      onSelect(!isSelected);
    }
    // Swipe left for quick status update (threshold: -100px)
    else if (diff < -100 && onQuickUpdate) {
      if (component.status === "NOT_STARTED") {
        onQuickUpdate("IN_PROGRESS");
      } else if (component.status === "IN_PROGRESS") {
        onQuickUpdate("COMPLETED");
      }
    }
    // If not a significant swipe, treat as tap
    else if (Math.abs(diff) < 10) {
      onClick();
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "relative transition-all duration-200",
        isSelected && "ring-2 ring-primary shadow-lg",
        isDragging && "opacity-90"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isDragging ? `translateX(${currentX - startX}px)` : 'translateX(0)',
      }}
    >
      {/* Swipe indicators */}
      {isDragging && (
        <>
          {currentX - startX > 50 && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-primary/20 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
          )}
          {currentX - startX < -50 && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-blue-500/20 flex items-center justify-center">
              {component.status === "NOT_STARTED" ? (
                <Clock className="h-6 w-6 text-blue-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-fieldComplete" />
              )}
            </div>
          )}
        </>
      )}

      <CardContent className="p-3 space-y-2">
        {/* Compact Header Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left side: Checkbox, ID, Drawing, Type/Size */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              className="h-5 w-5 rounded border-gray-300 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="text-xs text-blue-600">{component.drawingNumber}</span>
            </div>
            <h3 className="font-semibold text-sm truncate">
              {component.componentId}
            </h3>
          </div>
          
          {/* Right side: Status icon and menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {getStatusIcon()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onQuickUpdate && component.status === "NOT_STARTED" && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpdate("IN_PROGRESS");
                  }}>
                    <Clock className="mr-2 h-4 w-4" />
                    Start Work
                  </DropdownMenuItem>
                )}
                {onQuickUpdate && component.status === "IN_PROGRESS" && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpdate("COMPLETED");
                  }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Component details in a single line */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {component.type && <span className="font-medium">{component.type}</span>}
          {component.size && <span>• {component.size}</span>}
          {component.spec && <span>• {component.spec}</span>}
        </div>

        {/* Description - only if exists */}
        {component.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {component.description}
          </p>
        )}

        {/* Compact Milestone Section */}
        {milestoneStats.total > 0 && (
          <div className="milestone-section space-y-2 pt-2 border-t">
            {/* Single line milestone status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium truncate">
                  {milestoneStats.current?.milestoneName || "Complete"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {milestoneStats.completed}/{milestoneStats.total}
                </Badge>
              </div>
              <span className="text-xs font-bold">{component.completionPercent || 0}%</span>
            </div>
            
            {/* Progress bar */}
            <Progress value={component.completionPercent || 0} className="h-2" />
            
            {/* Update button - compact */}
            {onOpenMilestones && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMilestones();
                }}
              >
                <Target className="mr-2 h-4 w-4" />
                Update Milestones
              </Button>
            )}
          </div>
        )}

        {/* Compact Meta Information - Single line */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {component.area && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{component.area}</span>
            </div>
          )}
          {component.system && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{component.system}</span>
            </div>
          )}
          {component.testPackage && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              <span>{component.testPackage}</span>
            </div>
          )}
        </div>

        {/* Status and Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge 
            variant="outline" 
            className={cn("text-xs py-0.5 px-2", getStatusColor())}
          >
            {formatStatus(component.status)}
          </Badge>
          
          {onQuickUpdate && (
            <div>
              {component.status === "NOT_STARTED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpdate("IN_PROGRESS");
                  }}
                >
                  Start Work
                </Button>
              )}
              {component.status === "IN_PROGRESS" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpdate("COMPLETED");
                  }}
                >
                  Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}