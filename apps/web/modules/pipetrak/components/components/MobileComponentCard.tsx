"use client";

import { useState, useRef } from "react";
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
  Trash2
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
}

export function MobileComponentCard({ 
  component, 
  isSelected,
  onSelect,
  onClick, 
  onQuickUpdate,
  onEdit,
  onDuplicate,
  onDelete
}: MobileComponentCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

      <CardContent className="p-4 space-y-3">
        {/* Header with Component ID, Status and Actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(e.target.checked);
                }}
                className="h-5 w-5 rounded border-gray-300"
                onClick={(e) => e.stopPropagation()}
              />
              <h3 className="font-bold text-base">
                {component.componentId}
              </h3>
            </div>
            {component.drawingNumber && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <MapPin className="h-3 w-3" />
                <span>{component.drawingNumber}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}>
                  <ChevronRight className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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
                <DropdownMenuSeparator />
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Component Type and Size */}
        <div className="flex items-center gap-2 flex-wrap">
          {component.type && (
            <Badge variant="outline" className="text-xs">
              {component.type}
            </Badge>
          )}
          {component.size && (
            <Badge variant="outline" className="text-xs">
              {component.size}
            </Badge>
          )}
          {component.spec && (
            <Badge variant="outline" className="text-xs">
              {component.spec}
            </Badge>
          )}
        </div>

        {/* Description */}
        {component.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {component.description}
          </p>
        )}

        {/* Meta Information Grid - Larger touch targets */}
        <div className="grid grid-cols-2 gap-3 py-2">
          {component.area && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <span className="truncate">{component.area}</span>
            </div>
          )}
          {component.system && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-600" />
              </div>
              <span className="truncate">{component.system}</span>
            </div>
          )}
          {component.testPackage && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-gray-600" />
              </div>
              <span className="truncate">{component.testPackage}</span>
            </div>
          )}
          {component.material && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <span className="truncate">{component.material}</span>
            </div>
          )}
        </div>

        {/* Progress Bar - Larger touch area */}
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-bold">
              {component.completionPercent || 0}%
            </span>
          </div>
          <Progress 
            value={component.completionPercent || 0} 
            className="h-3"
          />
        </div>

        {/* Status Badge and Quick Actions - Larger buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge 
            variant="outline" 
            className={cn("text-sm py-1 px-3", getStatusColor())}
          >
            {formatStatus(component.status)}
          </Badge>
          
          {onQuickUpdate && (
            <div className="flex gap-2">
              {component.status === "NOT_STARTED" && (
                <Button
                  size="default"
                  variant="outline"
                  className="h-10 px-4"
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
                  size="default"
                  variant="outline"
                  className="h-10 px-4"
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

        {/* Swipe hint (shown only for first few cards) */}
        {component.status === "NOT_STARTED" && (
          <div className="text-xs text-center text-muted-foreground pt-2">
            Swipe right to select • Swipe left to start work
          </div>
        )}
      </CardContent>
    </Card>
  );
}